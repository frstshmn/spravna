<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Symfony\Component\HttpFoundation\Response;

class DeployController extends Controller
{
    public function deploy(Request $request): JsonResponse
    {
        $secret = config('app.deploy_secret');

        if (! $secret || ! hash_equals($secret, (string) $request->query('key', ''))) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $pull         = Process::path(base_path())->run(['git', 'pull']);
        $storageLink  = Process::path(base_path())->run([PHP_BINARY, 'artisan', 'storage:link', '--force']);
        $migrate      = Process::path(base_path())->run([PHP_BINARY, 'artisan', 'migrate', '--force']);

        // Fix permissions so the web server can read uploaded files
        $storagePublic = storage_path('app/public');
        $fixPermsOk    = false;
        $fixPermsError = '';
        try {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($storagePublic, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::SELF_FIRST
            );
            foreach ($iterator as $item) {
                chmod($item->getPathname(), $item->isDir() ? 0755 : 0644);
            }
            chmod($storagePublic, 0755);
            $fixPermsOk = true;
        } catch (\Throwable $e) {
            $fixPermsError = $e->getMessage();
        }

        return response()->json([
            'git_pull' => [
                'ok'     => $pull->successful(),
                'output' => $pull->output(),
                'error'  => $pull->errorOutput(),
            ],
            'storage_link' => [
                'ok'     => $storageLink->successful(),
                'output' => $storageLink->output(),
                'error'  => $storageLink->errorOutput(),
            ],
            'migrate' => [
                'ok'     => $migrate->successful(),
                'output' => $migrate->output(),
                'error'  => $migrate->errorOutput(),
            ],
            'fix_perms' => [
                'ok'    => $fixPermsOk,
                'error' => $fixPermsError,
            ],
        ]);
    }
}
