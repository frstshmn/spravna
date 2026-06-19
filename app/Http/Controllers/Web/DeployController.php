<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
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

        $pull = Process::path(base_path())->run(['git', 'pull']);

        // Reset OPcache so modified PHP files are recompiled fresh
        $opcacheCleared = function_exists('opcache_reset') && opcache_reset();

        // Run Laravel cache-clear and migrations in this same PHP 8.x process.
        // Avoids the PHP_BINARY version mismatch on shared hosting (system CLI may be PHP 5.6).
        $clearCacheOk     = false;
        $clearCacheOutput = '';
        try {
            Artisan::call('optimize:clear');
            $clearCacheOutput = Artisan::output();
            $clearCacheOk     = true;
        } catch (\Throwable $e) {
            $clearCacheOutput = $e->getMessage();
        }

        $migrateOk     = false;
        $migrateOutput = '';
        try {
            Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = Artisan::output();
            $migrateOk     = true;
        } catch (\Throwable $e) {
            $migrateOutput = $e->getMessage();
        }

        // Ensure public/storage is a real directory (not a symlink).
        // Shared hosting blocks symlinks to paths outside the web root.
        $storageDir = public_path('storage');
        $mkdirOk    = false;
        $mkdirError = '';
        try {
            if (is_link($storageDir)) {
                unlink($storageDir);
            }
            if (!is_dir($storageDir)) {
                mkdir($storageDir, 0755, true);
            }
            foreach (['avatars', 'portfolio'] as $sub) {
                $path = $storageDir . DIRECTORY_SEPARATOR . $sub;
                if (!is_dir($path)) {
                    mkdir($path, 0755, true);
                }
            }
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($storageDir, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::SELF_FIRST
            );
            foreach ($iterator as $item) {
                chmod($item->getPathname(), $item->isDir() ? 0755 : 0644);
            }
            chmod($storageDir, 0755);
            $mkdirOk = true;
        } catch (\Throwable $e) {
            $mkdirError = $e->getMessage();
        }

        $payload = [
            'php_version'  => PHP_VERSION,
            'opcache_reset' => $opcacheCleared,
            'git_pull'     => [
                'ok'     => $pull->successful(),
                'output' => $pull->output(),
                'error'  => $pull->errorOutput(),
            ],
            'cache_clear'  => [
                'ok'     => $clearCacheOk,
                'output' => $clearCacheOutput,
            ],
            'migrate'      => [
                'ok'     => $migrateOk,
                'output' => $migrateOutput,
            ],
            'storage_dirs' => [
                'ok'    => $mkdirOk,
                'error' => $mkdirError,
            ],
        ];

        $httpStatus = $migrateOk ? 200 : 500;

        return response()->json($payload, $httpStatus);
    }
}
