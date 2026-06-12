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

        $pull = Process::path(base_path())->run(['git', 'pull']);
        $migrate = Process::path(base_path())->run(['php', 'artisan', 'migrate', '--force']);

        return response()->json([
            'git_pull' => [
                'ok' => $pull->successful(),
                'output' => $pull->output(),
                'error' => $pull->errorOutput(),
            ],
            'migrate' => [
                'ok' => $migrate->successful(),
                'output' => $migrate->output(),
                'error' => $migrate->errorOutput(),
            ],
        ]);
    }
}
