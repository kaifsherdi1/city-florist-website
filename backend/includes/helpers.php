<?php
declare(strict_types=1);

function e($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400): void
{
    json_out(['error' => $message], $status);
}

function slugify(string $text): string
{
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-') ?: 'item';
}

function unique_slug(string $table, string $base, ?int $ignoreId = null): string
{
    $slug = slugify($base);
    $candidate = $slug;
    $i = 2;
    while (true) {
        $row = db_one("SELECT id FROM $table WHERE slug = ?", [$candidate]);
        if (!$row || ($ignoreId && (int) $row['id'] === $ignoreId)) {
            return $candidate;
        }
        $candidate = $slug . '-' . $i++;
    }
}

/** Default values for every setting the site reads. */
function setting_defaults(): array
{
    return [
        'shop_name'       => 'City Florist',
        'whatsapp_number' => (string) config('whatsapp_number', ''),
        'shop_phone'      => '',
        'email'           => '',
        'address'         => 'Hubballi, Karnataka',
        'hours'           => 'Open daily · 8:00 AM – 10:00 PM',
        'map_embed'       => 'https://www.google.com/maps?q=Hubballi,Karnataka&output=embed',
        'instagram'       => '',
        'facebook'        => '',
        'hero_title'      => 'Crafted in petals. Delivered with love.',
        'hero_subtitle'   => 'Fresh flower bouquets, chocolate bouquets, car & wedding-night decoration and bridal garlands — handmade in Hubballi.',
    ];
}

function settings(): array
{
    static $cache = null;
    if ($cache === null) {
        $cache = setting_defaults();
        try {
            foreach (db_all('SELECT name, value FROM settings') as $row) {
                $cache[$row['name']] = $row['value'];
            }
        } catch (PDOException $e) {
            // not installed yet
        }
    }
    return $cache;
}

function setting(string $name, string $default = ''): string
{
    return (string) (settings()[$name] ?? $default);
}

function save_setting(string $name, string $value): void
{
    if (db_one('SELECT name FROM settings WHERE name = ?', [$name])) {
        q('UPDATE settings SET value = ? WHERE name = ?', [$value, $name]);
    } else {
        q('INSERT INTO settings (name, value) VALUES (?, ?)', [$name, $value]);
    }
}

function client_ip(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 64);
}

/** Returns false if this IP did `action` more than $max times in the last $minutes. Records the attempt. */
function rate_limit(string $action, int $max, int $minutes): bool
{
    $since = date('Y-m-d H:i:s', time() - $minutes * 60);
    q('DELETE FROM attempts WHERE created_at < ?', [date('Y-m-d H:i:s', time() - 86400)]);
    $count = (int) db_value(
        'SELECT COUNT(*) FROM attempts WHERE ip = ? AND action = ? AND created_at >= ?',
        [client_ip(), $action, $since]
    );
    if ($count >= $max) {
        return false;
    }
    db_insert('attempts', ['ip' => client_ip(), 'action' => $action, 'created_at' => now()]);
    return true;
}

function clear_attempts(string $action): void
{
    q('DELETE FROM attempts WHERE ip = ? AND action = ?', [client_ip(), $action]);
}

/** Normalises an Indian mobile number to 91XXXXXXXXXX, or returns null if invalid. */
function normalize_phone(string $raw): ?string
{
    $digits = preg_replace('/\D+/', '', $raw);
    if (strlen($digits) === 12 && str_starts_with($digits, '91')) {
        $digits = substr($digits, 2);
    } elseif (strlen($digits) === 11 && str_starts_with($digits, '0')) {
        $digits = substr($digits, 1);
    }
    if (!preg_match('/^[6-9]\d{9}$/', $digits)) {
        return null;
    }
    return '91' . $digits;
}

function whatsapp_digits(string $raw): string
{
    return preg_replace('/\D+/', '', $raw);
}

function rupees($amount): string
{
    $amount = (float) $amount;
    return '₹' . number_format($amount, fmod($amount, 1.0) == 0.0 ? 0 : 2);
}

function site_url(string $path = ''): string
{
    return rtrim((string) config('site_url', ''), '/') . '/' . ltrim($path, '/');
}

function public_path(?string $path): ?string
{
    return $path ? '/' . ltrim($path, '/') : null;
}
