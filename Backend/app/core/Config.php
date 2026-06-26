<?php

namespace App\Core;

/**
 * Classe responsável por carregar variáveis do .env
 */
class Config
{
    private static array $data = [];

    public static function load(string $path): void
    {
        if (!file_exists($path)) {
            throw new \Exception(".env não encontrado");
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            if (str_starts_with(trim($line), '#')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            self::$data[trim($key)] = trim($value);
        }
    }

    public static function get(string $key, $default = null)
    {
        return self::$data[$key] ?? $default;
    }
}