<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Symfony\Component\HttpFoundation\Response;

class DeployController extends Controller
{
    private function resolvePhpBinary(): string
    {
        // Explicit override wins
        if ($env = env('PHP_CLI')) {
            return $env;
        }

        // On cPanel/EasyApache shared hosting PHP_BINARY may be old CLI; try common 8.x paths
        $candidates = [
            PHP_BINARY,
            '/opt/cpanel/ea-php83/root/usr/bin/php',
            '/opt/cpanel/ea-php82/root/usr/bin/php',
            '/usr/local/php83/bin/php',
            '/usr/local/php82/bin/php',
            '/usr/bin/php8.3',
            '/usr/bin/php8.2',
        ];

        foreach ($candidates as $bin) {
            if (is_executable($bin)) {
                $result = Process::run([$bin, '-r', 'echo PHP_MAJOR_VERSION;']);
                if ($result->successful() && (int) trim($result->output()) >= 8) {
                    return $bin;
                }
            }
        }

        return PHP_BINARY;
    }

    public function deploy(Request $request): JsonResponse
    {
        $secret = config('app.deploy_secret');

        if (! $secret || ! hash_equals($secret, (string) $request->query('key', ''))) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $pull = Process::path(base_path())->run(['git', 'pull']);

        // PHP_BINARY may point to the system default CLI (e.g. PHP 5.6) on shared hosting
        // where the web server runs PHP 8.x via FastCGI. Allow override via PHP_CLI in .env.
        $phpBin = $this->resolvePhpBinary();

        // Clear all Laravel caches so new migration files are picked up
        // (OPcache on shared hosting can serve stale bytecode after a git pull)
        $clearCache = Process::path(base_path())->run([$phpBin, 'artisan', 'optimize:clear']);

        $migrate = Process::path(base_path())->run(
            [$phpBin, 'artisan', 'migrate', '--force', '--no-interaction']
        );

        // Ensure public/storage is a real directory (not a symlink).
        // Shared hosting blocks symlinks to paths outside the web root.
        $storageDir = public_path('storage');
        $mkdirOk    = false;
        $mkdirError = '';
        try {
            if (is_link($storageDir)) {
                unlink($storageDir); // remove old symlink created by storage:link
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
            // Fix permissions on all existing files
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
            'php_binary' => ['constant' => PHP_BINARY, 'used' => $phpBin],
            'git_pull' => [
                'ok'     => $pull->successful(),
                'output' => $pull->output(),
                'error'  => $pull->errorOutput(),
            ],
            'cache_clear' => [
                'ok'     => $clearCache->successful(),
                'output' => $clearCache->output(),
                'error'  => $clearCache->errorOutput(),
            ],
            'migrate' => [
                'ok'     => $migrate->successful(),
                'output' => $migrate->output(),
                'error'  => $migrate->errorOutput(),
            ],
            'storage_dirs' => [
                'ok'    => $mkdirOk,
                'error' => $mkdirError,
            ],
        ];

        // Return 500 if migrate failed so CI can detect and surface the error
        $httpStatus = $migrate->successful() ? 200 : 500;

        return response()->json($payload, $httpStatus);
    }
}
