<?php
/**
 * POST /api/orders.php  {product_id, name, phone, note?, delivery_date?}
 * Saves the order and returns the WhatsApp link the customer is sent to.
 * Price and product name are always read from the database, never trusted from the browser.
 */
require __DIR__ . '/../includes/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_error('Method not allowed', 405);
}

try {
    $in = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($in)) {
        $in = $_POST;
    }

    // Honeypot: real visitors never fill this hidden field.
    if (!empty($in['website'])) {
        json_error('Invalid request', 400);
    }

    $name  = mb_substr(trim(preg_replace('/\s+/', ' ', (string) ($in['name'] ?? ''))), 0, 80);
    $phone = normalize_phone((string) ($in['phone'] ?? ''));
    $note  = mb_substr(trim((string) ($in['note'] ?? '')), 0, 500);
    $date  = (string) ($in['delivery_date'] ?? '');
    $date  = preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : null;

    if (mb_strlen($name) < 2) {
        json_error('Please enter your name.', 422);
    }
    if (!$phone) {
        json_error('Please enter a valid 10-digit mobile number.', 422);
    }

    $rows = db_all(
        'SELECT p.*, c.slug AS category_slug, c.name AS category_name
         FROM products p JOIN categories c ON c.id = p.category_id
         WHERE p.id = ? AND p.is_active = 1',
        [(int) ($in['product_id'] ?? 0)]
    );
    if (!$rows) {
        json_error('This product is no longer available.', 404);
    }
    $product = present_products($rows)[0];
    $pricing = $product['pricing'];

    if (!rate_limit('order', 10, 30)) {
        json_error('Too many orders from this device. Please message us directly on WhatsApp.', 429);
    }

    $orderId = db_insert('orders', [
        'product_id'     => $product['id'],
        'product_name'   => $product['name'],
        'price_at_order' => $pricing['final'],
        'customer_name'  => $name,
        'customer_phone' => $phone,
        'note'           => $note ?: null,
        'delivery_date'  => $date,
        'status'         => 'new',
        'created_at'     => now(),
    ]);

    if ($pricing['on_request']) {
        $priceLine = 'Price: Please share the price';
    } elseif ($pricing['final'] < $pricing['price']) {
        $priceLine = 'Price: ' . rupees($pricing['final']) . ' (MRP ' . rupees($pricing['price']) . ', ' . $pricing['discount_pct'] . '% off)';
    } else {
        $priceLine = 'Price: ' . rupees($pricing['final']);
    }

    $lines = [
        "🌸 *New Order #$orderId – City Florist*",
        '',
        '*Product:* ' . $product['name'],
        '*Category:* ' . $product['category']['name'],
        '*' . str_replace('Price:', 'Price:*', $priceLine),
        '',
        '*Name:* ' . $name,
        '*Phone:* +' . $phone,
    ];
    if ($date) {
        $lines[] = '*Needed on:* ' . date('d M Y', strtotime($date));
    }
    if ($note) {
        $lines[] = '*Note:* ' . $note;
    }
    if (!empty($product['images'][0]['src'])) {
        $lines[] = '';
        $lines[] = '*Photo:* ' . site_url($product['images'][0]['src']);
    }
    $lines[] = site_url('/product/' . $product['slug']);
    $message = implode("\n", $lines);

    $owner = whatsapp_digits(setting('whatsapp_number'));

    json_out([
        'order_id' => $orderId,
        'message'  => $message,
        'whatsapp' => 'https://wa.me/' . $owner . '?text=' . rawurlencode($message),
    ], 201);
} catch (Throwable $e) {
    json_error(config('debug') ? $e->getMessage() : 'Something went wrong. Please try again.', 500);
}
