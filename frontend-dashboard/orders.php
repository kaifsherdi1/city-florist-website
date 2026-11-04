<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_layout.php';
require_admin();

$statuses = ['new' => 'New', 'contacted' => 'Contacted', 'done' => 'Delivered', 'cancelled' => 'Cancelled'];

if (is_post()) {
    verify_csrf();
    $id = (int) ($_POST['id'] ?? 0);
    if (($_POST['action'] ?? '') === 'delete') {
        q('DELETE FROM orders WHERE id = ?', [$id]);
        flash('Order deleted.');
    } elseif (isset($statuses[$_POST['status'] ?? ''])) {
        q('UPDATE orders SET status = ? WHERE id = ?', [$_POST['status'], $id]);
    }
    redirect('/admin/orders.php?' . http_build_query(array_intersect_key($_GET, ['status' => 1])));
}

$filter = $_GET['status'] ?? '';
$where = isset($statuses[$filter]) ? 'WHERE status = ?' : '';
$params = $where ? [$filter] : [];

if (isset($_GET['export'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="city-florist-orders-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Order #', 'Date', 'Customer', 'Phone', 'Product', 'Price', 'Delivery date', 'Note', 'Status'], ',', '"', '');
    foreach (db_all("SELECT * FROM orders $where ORDER BY id DESC", $params) as $o) {
        fputcsv($out, [$o['id'], $o['created_at'], $o['customer_name'], '+' . $o['customer_phone'], $o['product_name'], $o['price_at_order'], $o['delivery_date'], $o['note'], $o['status']], ',', '"', '');
    }
    exit;
}

$page = max(1, (int) ($_GET['page'] ?? 1));
$per = 30;
$total = (int) db_value("SELECT COUNT(*) FROM orders $where", $params);
$orders = db_all("SELECT * FROM orders $where ORDER BY id DESC LIMIT $per OFFSET " . (($page - 1) * $per), $params);

admin_header('Orders', 'orders');
?>
<div class="page-head">
  <h1>Orders <small class="muted"><?= $total ?></small></h1>
  <a class="btn ghost" href="?<?= http_build_query(['status' => $filter, 'export' => 1]) ?>">Download CSV</a>
</div>

<div class="tabs">
  <a href="/admin/orders.php" class="<?= $filter === '' ? 'active' : '' ?>">All</a>
  <?php foreach ($statuses as $k => $label): ?>
    <a href="?status=<?= $k ?>" class="<?= $filter === $k ? 'active' : '' ?>"><?= $label ?></a>
  <?php endforeach; ?>
</div>

<p class="muted small">Every “Buy” on the website is saved here, even if the customer didn’t press send in WhatsApp — so you can follow up.</p>

<div class="order-list">
  <?php foreach ($orders as $o):
      $reply = "Hello {$o['customer_name']}, thank you for your order #{$o['id']} ({$o['product_name']}) at City Florist 🌸";
  ?>
    <article class="order card">
      <header>
        <b>#<?= (int) $o['id'] ?> · <?= e($o['product_name']) ?></b>
        <span class="muted small"><?= e(date('d M Y, h:i A', strtotime($o['created_at']))) ?></span>
      </header>
      <div class="order-body">
        <div>
          <div><?= e($o['customer_name']) ?> · <a href="tel:+<?= e($o['customer_phone']) ?>">+<?= e($o['customer_phone']) ?></a></div>
          <div class="price"><?= (float) $o['price_at_order'] > 0 ? rupees($o['price_at_order']) : 'Price on request' ?></div>
          <?php if ($o['delivery_date']): ?><div class="small">Needed on: <b><?= e(date('d M Y', strtotime($o['delivery_date']))) ?></b></div><?php endif; ?>
          <?php if ($o['note']): ?><div class="small note">“<?= e($o['note']) ?>”</div><?php endif; ?>
        </div>
        <div class="order-actions">
          <a class="btn small wa" target="_blank" href="https://wa.me/<?= e($o['customer_phone']) ?>?text=<?= rawurlencode($reply) ?>">WhatsApp</a>
          <form method="post" class="inline">
            <?= csrf_field() ?>
            <input type="hidden" name="id" value="<?= (int) $o['id'] ?>">
            <select name="status" onchange="this.form.submit()" class="pill-select <?= e($o['status']) ?>">
              <?php foreach ($statuses as $k => $label): ?>
                <option value="<?= $k ?>" <?= $o['status'] === $k ? 'selected' : '' ?>><?= $label ?></option>
              <?php endforeach; ?>
            </select>
          </form>
          <form method="post" class="inline" onsubmit="return confirm('Delete order #<?= (int) $o['id'] ?>?')">
            <?= csrf_field() ?>
            <input type="hidden" name="id" value="<?= (int) $o['id'] ?>">
            <input type="hidden" name="action" value="delete">
            <button class="btn small danger">✕</button>
          </form>
        </div>
      </div>
    </article>
  <?php endforeach; ?>
  <?php if (!$orders): ?><p class="muted">No orders here yet.</p><?php endif; ?>
</div>

<?php if ($total > $per): ?>
  <nav class="pager">
    <?php for ($i = 1; $i <= (int) ceil($total / $per); $i++): ?>
      <a class="<?= $i === $page ? 'active' : '' ?>" href="?<?= http_build_query(['status' => $filter, 'page' => $i]) ?>"><?= $i ?></a>
    <?php endfor; ?>
  </nav>
<?php endif; ?>
<?php admin_footer();
