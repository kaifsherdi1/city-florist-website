<?php
/** Everything the home page needs in one request. */
require __DIR__ . '/../includes/bootstrap.php';

try {
    $s = settings();
    $offers = array_map(fn($o) => [
        'id'       => (int) $o['id'],
        'title'    => $o['title'],
        'subtitle' => $o['subtitle'] ?? '',
        'discount' => (int) $o['discount_pct'],
        'ends_at'  => date(DATE_ATOM, strtotime($o['ends_at'])),
        'image'    => public_path($o['image']),
        'link'     => $o['product_slug'] ? '/product/' . $o['product_slug'] : ($o['category_slug'] ? '/shop?cat=' . $o['category_slug'] : '/shop'),
    ], active_offers());

    json_out([
        'settings' => array_intersect_key($s, array_flip([
            'shop_name', 'whatsapp_number', 'shop_phone', 'email', 'address', 'hours',
            'map_embed', 'instagram', 'facebook', 'hero_title', 'hero_subtitle',
        ])),
        'categories' => public_categories(),
        'offers'     => $offers,
        'featured'   => product_query('p.is_featured = 1', [], 'p.sort, p.id', 12),
    ]);
} catch (Throwable $e) {
    json_error(config('debug') ? $e->getMessage() : 'Server error', 500);
}
