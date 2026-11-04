<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_layout.php';
require_admin();

if (is_post()) {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'delete') {
        $id = (int) ($_POST['id'] ?? 0);
        foreach (db_all('SELECT path, thumb_path FROM product_images WHERE product_id = ?', [$id]) as $img) {
            image_delete($img['path'], $img['thumb_path']);
        }
        q('DELETE FROM product_images WHERE product_id = ?', [$id]);
        q('DELETE FROM products WHERE id = ?', [$id]);
        flash('Product deleted.');
    }

    if ($action === 'quick_save') {
        foreach ((array) ($_POST['rows'] ?? []) as $id => $row) {
            $price = max(0, (float) ($row['price'] ?? 0));
            $sale  = trim((string) ($row['sale'] ?? ''));
            $name  = mb_substr(trim((string) ($row['name'] ?? '')), 0, 160) ?: 'Untitled';
            $old   = db_one('SELECT name FROM products WHERE id = ?', [(int) $id]);
            if (!$old) {
                continue;
            }
            $extra = $old['name'] !== $name ? ['slug' => unique_slug('products', $name, (int) $id)] : [];
            db_update('products', (int) $id, $extra + [
                'name'        => $name,
                'price'       => $price,
                'sale_price'  => $sale === '' ? null : max(0, (float) $sale),
                'is_active'   => empty($row['active']) ? 0 : 1,
                'is_featured' => empty($row['featured']) ? 0 : 1,
            ]);
        }
        flash('Changes saved.');
    }
    redirect('/admin/products.php?' . http_build_query(array_intersect_key($_GET, array_flip(['q', 'cat', 'unpriced']))));
}

$where = ['1=1'];
$params = [];
if ($search = trim($_GET['q'] ?? '')) {
    $where[] = 'p.name LIKE ?';
    $params[] = "%$search%";
}
if ($cat = $_GET['cat'] ?? '') {
    $where[] = 'c.slug = ?';
    $params[] = $cat;
}
if (!empty($_GET['unpriced'])) {
    $where[] = 'p.price <= 0';
}
$products = db_all(
    'SELECT p.*, c.name AS category_name,
        (SELECT thumb_path FROM product_images i WHERE i.product_id = p.id ORDER BY sort, id LIMIT 1) AS thumb
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE ' . implode(' AND ', $where) . ' ORDER BY c.sort, p.sort, p.id DESC',
    $params
);

admin_header('Products', 'products');
?>
<div class="page-head">
  <h1>Products <small class="muted"><?= count($products) ?></small></h1>
  <a class="btn" href="/admin/product-edit.php">+ Add product</a>
</div>

<form class="filters" method="get">
  <input type="search" name="q" value="<?= e($search) ?>" placeholder="Search by name…">
  <select name="cat" onchange="this.form.submit()">
    <option value="">All categories</option>
    <?php foreach (category_options() as $c): ?>
      <option value="<?= e($c['slug']) ?>" <?= $cat === $c['slug'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
    <?php endforeach; ?>
  </select>
  <label class="check"><input type="checkbox" name="unpriced" value="1" <?= !empty($_GET['unpriced']) ? 'checked' : '' ?> onchange="this.form.submit()"> Only without price</label>
  <button class="btn ghost" type="submit">Filter</button>
</form>

<p class="muted small">Tip: edit names and prices right here and press <b>Save all changes</b>. Leave the price at 0 to show “Ask for price”. Click a photo to edit photos and description.</p>

<form method="post">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="quick_save">
  <div class="product-list">
    <?php foreach ($products as $p): ?>
      <div class="product-row <?= $p['is_active'] ? '' : 'inactive' ?>">
        <a class="thumb" href="/admin/product-edit.php?id=<?= (int) $p['id'] ?>">
          <?php if ($p['thumb']): ?><img src="/<?= e($p['thumb']) ?>" alt="" loading="lazy"><?php else: ?><span>No photo</span><?php endif; ?>
        </a>
        <div class="fields">
          <input class="name" name="rows[<?= (int) $p['id'] ?>][name]" value="<?= e($p['name']) ?>" aria-label="Name">
          <span class="muted small"><?= e($p['category_name']) ?></span>
          <div class="price-fields">
            <label>Price ₹<input type="number" min="0" step="1" name="rows[<?= (int) $p['id'] ?>][price]" value="<?= (float) $p['price'] ?>"></label>
            <label>Sale ₹<input type="number" min="0" step="1" name="rows[<?= (int) $p['id'] ?>][sale]" value="<?= $p['sale_price'] !== null ? (float) $p['sale_price'] : '' ?>" placeholder="—"></label>
          </div>
          <div class="toggles">
            <label class="check"><input type="checkbox" name="rows[<?= (int) $p['id'] ?>][active]" value="1" <?= $p['is_active'] ? 'checked' : '' ?>> Visible</label>
            <label class="check"><input type="checkbox" name="rows[<?= (int) $p['id'] ?>][featured]" value="1" <?= $p['is_featured'] ? 'checked' : '' ?>> Featured</label>
          </div>
        </div>
        <div class="row-actions">
          <a class="btn small ghost" href="/admin/product-edit.php?id=<?= (int) $p['id'] ?>">Edit</a>
          <button class="btn small danger" type="submit" form="del-<?= (int) $p['id'] ?>">Delete</button>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
  <?php if ($products): ?>
    <div class="sticky-save"><button class="btn" type="submit">Save all changes</button></div>
  <?php else: ?>
    <p class="muted">No products found.</p>
  <?php endif; ?>
</form>

<?php foreach ($products as $p): ?>
  <form id="del-<?= (int) $p['id'] ?>" method="post" onsubmit="return confirm('Delete “<?= e(addslashes($p['name'])) ?>” and its photos?')" hidden>
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="delete">
    <input type="hidden" name="id" value="<?= (int) $p['id'] ?>">
  </form>
<?php endforeach; ?>
<?php admin_footer();
