<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InstagramService
{
    /**
     * Fetch a public Instagram profile's picture and store it locally.
     * Returns a public storage URL, or null if it could not be fetched.
     */
    public function fetchAvatar(string $username): ?string
    {
        $username = Str::of($username)->trim()->ltrim('@')->toString();
        if ($username === '') {
            return null;
        }

        try {
            $page = Http::withHeaders([
                'User-Agent' => 'Googlebot/2.1 (+http://www.google.com/bot.html)',
                'Accept-Language' => 'en-US,en;q=0.9',
            ])->withOptions(['verify' => false])->timeout(10)->get("https://www.instagram.com/{$username}/");

            if (!$page->successful()) {
                return null;
            }

            if (!preg_match('/property="og:image" content="([^"]+)"/', $page->body(), $m)) {
                return null;
            }

            $imageUrl = html_entity_decode($m[1]);

            $image = Http::withHeaders(['User-Agent' => 'Mozilla/5.0'])
                ->withOptions(['verify' => false])
                ->timeout(10)
                ->get($imageUrl);

            if (!$image->successful()) {
                return null;
            }

            $path = "avatars/instagram_{$username}.jpg";
            Storage::disk('public')->put($path, $image->body());

            return Storage::url($path);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
