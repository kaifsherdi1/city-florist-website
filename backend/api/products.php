<?php
/**
 * GET /api/products.php                → all live products
 * GET /api/products.php?cat=<slug>     → one category
 * GET /api/products.php?slug=<slug>    → single product + related
 */
require __DIR__ . '/../includes/bootstrap.php';

try {
    if ($slug = (string) ($_GET['slug'] ?? '')) {
        $found = product_query('p.slug = ?', [$slug], 'p.id', 1);
        if (!$found) {
            json_error('Product not found', 404);
        }
        $product = $found[0];
        $related = product_query('c.slug = ? AND p.slug <> ?', [$product['category']['slug'], $slug], 'p.is_featured DESC, p.sort', 4);
        json_out(['product' => $product, 'related' => $related]);
    }

    $cat = (string) ($_GET['cat'] ?? '');
    $products = $cat
        ? product_query('c.slug = ?', [$cat], 'p.is_featured DESC, p.sort, p.id DESC')
        : product_query('1=1', [], 'c.sort, p.is_featured DESC, p.sort, p.id DESC');

    json_out(['products' => $products, 'categories' => public_categories()]);
} catch (Throwable $e) {
    json_error(config('debug') ? $e->getMessage() : 'Server error', 500);
}
