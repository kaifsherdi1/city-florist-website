<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_layout.php';
require_admin();

$today = date('Y-m-d 00:00:00');
$stats = [
    'Orders today'   => (int) db_value('SELECT COUNT(*) FROM orders WHERE created_at >= ?', [$today]),
    'New orders'     => (int) db_value("SELECT COUNT(*) FROM orders WHERE status = 'new'"),
    'Live products'  => (int) db_value('SELECT COUNT(*) FROM products WHERE is_active = 1'),
    'Running offers' => count(active_offers()),
];
$unpriced = (int) db_value('SELECT COUNT(*) FROM products WHERE price <= 0 AND is_active = 1');
$recent = db_all('SELECT * FROM orders ORDER BY id DESC LIMIT 8');

admin_header('Dashboard', 'dashboard');
?>
<div class="page-head">
  <h1>Good <?= date('H') < 12 ? 'morning' : (date('H') < 17 ? 'afternoon' : 'evening') ?> 🌸</h1>
  <div class="actions">
    <a class="btn" href="/admin/product-edit.php">+ Add product</a>
    <a class="btn ghost" href="/admin/offers.php#new">+ Today's offer</a>
  </div>
</div>

<div class="stats">
  <?php foreach ($stats as $label => $n): ?>
    <div class="stat"><b><?= $n ?></b><span><?= e($label) ?></span></div>
  <?php endforeach; ?>
</div>

<?php if ($unpriced): ?>
  <div class="flash info">
    <?= $unpriced ?> products have no price yet and show <i>“Ask for price”</i> on the website.
    <a href="/admin/products.php?unpriced=1">Add prices →</a>
  </div>
<?php endif; ?>

<section class="card">
  <div class="card-head"><h2>Latest orders</h2><a href="/admin/orders.php">All orders →</a></div>
  <?php if (!$recent): ?>
    <p class="muted">No orders yet. When a customer taps “Buy” on the website it will show up here.</p>
  <?php else: ?>
    <div class="table-scroll"><table>
      <thead><tr><th>#</th><th>When</th><th>Customer</th><th>Product</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>
      <?php foreach ($recent as $o): ?>
        <tr>
          <td><?= (int) $o['id'] ?></td>
          <td><?= e(date('d M, h:i A', strtotime($o['created_at']))) ?></td>
          <td><?= e($o['customer_name']) ?><br><a href="https://wa.me/<?= e($o['customer_phone']) ?>" target="_blank">+<?= e($o['customer_phone']) ?></a></td>
          <td><?= e($o['product_name']) ?></td>
          <td><?= (float) $o['price_at_order'] > 0 ? rupees($o['price_at_order']) : 'On request' ?></td>
          <td><span class="pill <?= e($o['status']) ?>"><?= e($o['status']) ?></span></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table></div>
  <?php endif; ?>
</section>
<?php admin_footer();
