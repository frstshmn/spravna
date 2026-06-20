<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AnthropicService
{
    private const API_URL    = 'https://api.anthropic.com/v1/messages';
    private const MODEL      = 'claude-haiku-4-5-20251001';
    private const MAX_TOKENS = 800;

    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = (string) env('ANTHROPIC_API_KEY', '');
    }

    /**
     * Send a prompt to Claude and return parsed JSON array.
     * Throws \RuntimeException on HTTP error or schema mismatch.
     */
    public function sendMessage(string $systemPrompt, string $userMessage): array
    {
        $response = Http::timeout(30)
            ->withHeaders([
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])
            ->post(self::API_URL, [
                'model'      => self::MODEL,
                'max_tokens' => self::MAX_TOKENS,
                'system'     => $systemPrompt,
                'messages'   => [
                    ['role' => 'user', 'content' => $userMessage],
                ],
            ]);

        if (! $response->successful()) {
            Log::error('Anthropic API error', ['status' => $response->status()]);
            throw new \RuntimeException('Anthropic API request failed with status ' . $response->status());
        }

        $text = $response->json('content.0.text', '');

        return $this->parseAndValidate($text);
    }

    private function parseAndValidate(string $text): array
    {
        $decoded = json_decode(trim($text), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Anthropic returned invalid JSON: ' . json_last_error_msg());
        }

        if (! isset($decoded['highlights'], $decoded['suggestions'])) {
            throw new \RuntimeException('Anthropic JSON missing required keys');
        }

        return [
            'highlights'  => array_values(array_filter((array) $decoded['highlights'], 'is_string')),
            'suggestions' => array_values(array_filter((array) $decoded['suggestions'], 'is_string')),
        ];
    }
}
