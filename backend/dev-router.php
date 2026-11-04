<?php
/**
 * Local development only. Mirrors the live Hostinger layout:
 *   /admin/*   → frontend-dashboard/
 *   /api/*     → backend/api/
 *   /uploads/* → backend/uploads/
 * Run from the repo root: php -S 127.0.0.1:8000 backend/dev-router.php
 * The React site runs separately on Vite (npm run dev) and proxies these paths here.
 */
$repo = dirname(__DIR__);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

$mounts = [
    '/admin'   => "$repo/frontend-dashboard",
    '/api'     => "$repo/backend/api",
    '/uploads' => "$repo/backend/uploads",
];

foreach ($mounts as $prefix => $dir) {
    if ($path !== $prefix && !str_starts_with($path, "$prefix/")) {
        continue;
    }
    $rel = substr($path, strlen($prefix)) ?: '/';
    if (str_contains($rel, '..')) {
        break;
    }
    $file = $dir . $rel;
    if (is_dir($file)) {
        $file = rtrim($file, '/') . '/index.php';
    }
    if (!is_file($file)) {
        break;
    }
    if (str_ends_with($file, '.php')) {
        $_SERVER['SCRIPT_NAME'] = $path;
        chdir(dirname($file));
        require $file;
        return true;
    }
    $types = ['css' => 'text/css', 'js' => 'application/javascript', 'webp' => 'image/webp', 'jpg' => 'image/jpeg', 'png' => 'image/png', 'svg' => 'image/svg+xml'];
    header('Content-Type: ' . ($types[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? 'application/octet-stream'));
    readfile($file);
    return true;
}

// Anything else: serve the built React site if present (after `npm run build`), with SPA fallback.
$dist = "$repo/frontend-user/dist";
if (is_dir($dist)) {
    $file = $dist . $path;
    if ($path !== '/' && is_file($file)) {
        $types = ['css' => 'text/css', 'js' => 'application/javascript', 'webp' => 'image/webp', 'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'woff2' => 'font/woff2'];
        header('Content-Type: ' . ($types[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? 'application/octet-stream'));
        readfile($file);
        return true;
    }
    readfile("$dist/index.html");
    return true;
}

http_response_code(404);
echo 'Not found. Run the React site with: cd frontend-user && npm run dev';
return true;
