<?php
/**
 * Exports the live catalogue (settings, categories, products, offers) into
 * frontend-user/src/catalog/ and its photos into frontend-user/public/catalog/,
 * so the website still shows every
 * product when it is hosted without the PHP API (for example on Vercel).
 *
 * Run locally after changing products in the dashboard, then commit and push:
 *   php backend/scripts/export-static.php
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit('Run this from the command line.');
}

require dirname(__DIR__) . '/includes/bootstrap.php';

$out = dirname(ROOT) . '/frontend-user/public/catalog';   // photos, served as /catalog/...
$data = dirname(ROOT) . '/frontend-user/src/catalog';     // JSON, bundled into the site's JavaScript
$copied = [];

/** Copies an /uploads/... file into the export and returns its new public path. */
$asset = function (?string $path) use ($out, &$copied): ?string {
    if (!$path || !str_starts_with($path, '/uploads/')) {
        return $path;
    }
    $src = ROOT . $path;
    $rel = substr($path, strlen('/uploads/'));
    if (!isset($copied[$rel]) && is_file($src)) {
        $dest = "$out/$rel";
        if (!is_dir(dirname($dest))) {
            mkdir(dirname($dest), 0755, true);
        }
        copy($src, $dest);
        $copied[$rel] = true;
    }
    return '/catalog/' . $rel;
};

$withAssets = function (array $products) use ($asset): array {
    return array_map(function ($p) use ($asset) {
        $p['images'] = array_map(fn($i) => ['src' => $asset($i['src']), 'thumb' => $asset($i['thumb'])], $p['images']);
        return $p;
    }, $products);
};

$categories = array_map(fn($c) => ['cover' => $asset($c['cover'])] + $c, public_categories());

$s = settings();
$site = [
    'settings' => array_intersect_key($s, array_flip([
        'shop_name', 'whatsapp_number', 'shop_phone', 'email', 'address', 'hours',
        'map_embed', 'instagram', 'facebook', 'hero_title', 'hero_subtitle',
    ])),
    'categories' => $categories,
    'offers'     => array_map(fn($o) => [
        'id'       => (int) $o['id'],
        'title'    => $o['title'],
        'subtitle' => $o['subtitle'] ?? '',
        'discount' => (int) $o['discount_pct'],
        'ends_at'  => date(DATE_ATOM, strtotime($o['ends_at'])),
        'image'    => $asset(public_path($o['image'])),
        'link'     => $o['product_slug'] ? '/product/' . $o['product_slug'] : ($o['category_slug'] ? '/shop?cat=' . $o['category_slug'] : '/shop'),
    ], active_offers()),
    'featured'   => $withAssets(product_query('p.is_featured = 1', [], 'p.sort, p.id', 12)),
    'ready'      => $withAssets(product_query('c.slug = ?', ['ready-to-go'], 'p.sort, p.id')),
];
$products = [
    'products'   => $withAssets(product_query('1=1', [], 'c.sort, p.is_featured DESC, p.sort, p.id DESC')),
    'categories' => $categories,
];

if (!is_dir($data)) {
    mkdir($data, 0755, true);
}
$flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
file_put_contents("$data/site.json", json_encode($site, $flags));
file_put_contents("$data/products.json", json_encode($products, $flags));

printf("Exported %d products and %d categories to %s, and %d images to %s\n", count($products['products']), count($categories), $data, count($copied), $out);
