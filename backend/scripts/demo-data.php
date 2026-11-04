<?php
/**
 * Fills the catalogue with demo data, safe to run more than once:
 *   1. imports seed photos (database/seed/manifest.json) that aren't products yet, e.g. new room-decoration photos;
 *   2. gives every product still at ₹0 a realistic Hubballi price, with ~1 in 4 on sale.
 * Products the owner has already priced are never touched.
 *
 * Run locally: php backend/scripts/demo-data.php   (then php backend/scripts/export-static.php for Vercel)
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit('Run this from the command line.');
}

require dirname(__DIR__) . '/includes/bootstrap.php';

// Typical 2026 retail prices for a florist in a tier-2 city (garlands priced per pair).
const PRICE_TIERS = [
    'flower-bouquets'    => [599, 799, 999, 1199, 1499, 1799, 2199, 2499],
    'chocolate-bouquets' => [899, 1199, 1499, 1799, 2199, 2499, 2999],
    'car-decoration'     => [2999, 3999, 4999, 5999, 7499, 8999, 10999],
    'room-decoration'    => [3499, 4499, 5499, 6999, 8499, 9999, 12999],
    'garlands'           => [1199, 1499, 1999, 2499, 2999, 3499, 4499],
];

const ROOM_DESCRIPTION = 'A romantic surprise set up in your room with fresh rose petals, candles and fairy lights. '
    . 'Representative photo: we design every setup for your room, theme and budget.';

// 1. Import seed photos that aren't products yet.
$manifest = json_decode((string) file_get_contents(ROOT . '/database/seed/manifest.json'), true) ?: [];
$imported = 0;
foreach ($manifest as $i => $item) {
    $base = $item['category'] . '-' . pathinfo($item['image'], PATHINFO_FILENAME);
    $path = "uploads/products/$base.webp";
    $categoryId = db_value('SELECT id FROM categories WHERE slug = ?', [$item['category']]);
    if (!$categoryId || db_value('SELECT id FROM product_images WHERE path = ?', [$path])) {
        continue;
    }
    if (!is_dir(UPLOAD_DIR . '/products')) {
        mkdir(UPLOAD_DIR . '/products', 0755, true);
    }
    copy(ROOT . '/database/seed/' . $item['image'], UPLOAD_DIR . "/products/$base.webp");
    copy(ROOT . '/database/seed/' . $item['thumb'], UPLOAD_DIR . "/products/$base-thumb.webp");

    $pid = db_insert('products', [
        'category_id' => (int) $categoryId,
        'name'        => $item['name'],
        'slug'        => unique_slug('products', $item['name']),
        'description' => $item['category'] === 'room-decoration'
            ? ROOM_DESCRIPTION
            : 'Handcrafted fresh at City Florist, Hubballi. Message us to customise colours, size or add a card.',
        'price'       => 0,
        'is_featured' => 0,
        'is_active'   => 1,
        'sort'        => $i,
        'created_at'  => now(),
    ]);
    db_insert('product_images', ['product_id' => $pid, 'path' => $path, 'thumb_path' => "uploads/products/$base-thumb.webp", 'sort' => 0]);
    $imported++;
}

// 2. Price everything still at ₹0. Prices come from a hash of the slug, so re-running gives the same result.
$priced = 0;
$rows = db_all('SELECT p.id, p.slug, c.slug AS category FROM products p JOIN categories c ON c.id = p.category_id WHERE p.price <= 0');
foreach ($rows as $row) {
    $tiers = PRICE_TIERS[$row['category']] ?? null;
    if (!$tiers) {
        continue;
    }
    $hash = crc32($row['slug']);
    $price = $tiers[$hash % count($tiers)];
    // Roughly 1 in 4 on sale at 10–20% off, rounded to a ₹…49 / ₹…99 price.
    $sale = null;
    if ($hash % 4 === 0) {
        $off = [0.9, 0.85, 0.8][intdiv($hash, 4) % 3];
        $sale = max(99, (int) (floor($price * $off / 50) * 50) - 1);
    }
    db_update('products', (int) $row['id'], ['price' => $price, 'sale_price' => $sale]);
    $priced++;
}

printf("Imported %d new products, priced %d products.\n", $imported, $priced);
