<?php
declare(strict_types=1);

/** Offers that are switched on and running right now. */
function active_offers(): array
{
    static $offers = null;
    if ($offers === null) {
        $offers = db_all(
            'SELECT o.*, p.slug AS product_slug, p.name AS product_name, c.slug AS category_slug, c.name AS category_name
             FROM offers o
             LEFT JOIN products p ON p.id = o.product_id
             LEFT JOIN categories c ON c.id = o.category_id
             WHERE o.is_active = 1 AND o.starts_at <= ? AND o.ends_at >= ?
             ORDER BY o.discount_pct DESC, o.ends_at ASC',
            [now(), now()]
        );
    }
    return $offers;
}

/** Best running offer for a product: product-specific, then its category, then site-wide. */
function offer_for(array $product): ?array
{
    $best = null;
    foreach (active_offers() as $offer) {
        $applies = ($offer['product_id'] && (int) $offer['product_id'] === (int) $product['id'])
            || ($offer['category_id'] && (int) $offer['category_id'] === (int) $product['category_id'])
            || (!$offer['product_id'] && !$offer['category_id']);
        if ($applies && (!$best || $offer['discount_pct'] > $best['discount_pct'])) {
            $best = $offer;
        }
    }
    return $best;
}

/** Works out the price a customer pays. Server-side source of truth for orders. */
function pricing(array $product): array
{
    $price = (float) $product['price'];
    $sale  = $product['sale_price'] !== null && $product['sale_price'] !== '' ? (float) $product['sale_price'] : null;

    if ($price <= 0) {
        return ['price' => 0, 'final' => 0, 'discount_pct' => 0, 'offer' => null, 'on_request' => true];
    }

    $base  = ($sale !== null && $sale > 0 && $sale < $price) ? $sale : $price;
    $offer = offer_for($product);
    $final = $offer ? round($base * (100 - (int) $offer['discount_pct']) / 100) : $base;

    return [
        'price'        => $price,
        'final'        => $final,
        'discount_pct' => $final < $price ? (int) round(($price - $final) / $price * 100) : 0,
        'offer'        => $offer ? $offer['title'] : null,
        'on_request'   => false,
    ];
}

function product_images(array $productIds): array
{
    if (!$productIds) {
        return [];
    }
    $in = implode(',', array_fill(0, count($productIds), '?'));
    $map = [];
    foreach (db_all("SELECT * FROM product_images WHERE product_id IN ($in) ORDER BY sort, id", array_values($productIds)) as $img) {
        $map[(int) $img['product_id']][] = [
            'src'   => public_path($img['path']),
            'thumb' => public_path($img['thumb_path']),
        ];
    }
    return $map;
}

/** Shapes product rows for the public API. */
function present_products(array $rows): array
{
    $images = product_images(array_map(fn($r) => (int) $r['id'], $rows));
    return array_map(function ($r) use ($images) {
        return [
            'id'          => (int) $r['id'],
            'slug'        => $r['slug'],
            'name'        => $r['name'],
            'description' => $r['description'] ?? '',
            'category'    => ['slug' => $r['category_slug'], 'name' => $r['category_name']],
            'featured'    => (bool) $r['is_featured'],
            'images'      => $images[(int) $r['id']] ?? [],
            'pricing'     => pricing($r),
        ];
    }, $rows);
}

function product_query(string $where = '1=1', array $params = [], string $order = 'p.sort, p.id DESC', int $limit = 0): array
{
    $sql = "SELECT p.*, c.slug AS category_slug, c.name AS category_name
            FROM products p JOIN categories c ON c.id = p.category_id
            WHERE p.is_active = 1 AND ($where)
            ORDER BY $order";
    if ($limit > 0) {
        $sql .= ' LIMIT ' . $limit;
    }
    return present_products(db_all($sql, $params));
}

function public_categories(): array
{
    $rows = db_all(
        'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
         FROM categories c ORDER BY c.sort, c.id'
    );
    return array_map(function ($c) {
        $cover = $c['cover_image'];
        if (!$cover) {
            $cover = db_value(
                'SELECT i.path FROM product_images i JOIN products p ON p.id = i.product_id
                 WHERE p.category_id = ? AND p.is_active = 1 ORDER BY p.is_featured DESC, p.sort, i.sort LIMIT 1',
                [$c['id']]
            );
        }
        return [
            'slug'    => $c['slug'],
            'name'    => $c['name'],
            'tagline' => $c['tagline'] ?? '',
            'cover'   => public_path($cover ?: null),
            'count'   => (int) $c['product_count'],
        ];
    }, $rows);
}

function default_categories(): array
{
    return [
        ['flower-bouquets',    'Flower Bouquets',    'Hand-tied roses, lilies & seasonal blooms for every feeling.'],
        ['chocolate-bouquets', 'Chocolate Bouquets', 'Sweet surprises wrapped like flowers — Ferrero, Dairy Milk & more.'],
        ['car-decoration',     'Car Decoration',     'Wedding car styling with fresh flowers, ribbons & elegance.'],
        ['room-decoration',    'Room Decoration',    'Wedding-night & surprise room décor with petals, candles and lights.'],
        ['garlands',           'Bridal Garlands',    'Fresh varmala & haar for the bride and groom.'],
    ];
}
