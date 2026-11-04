<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_layout.php';
require_admin();

$id = (int) ($_GET['id'] ?? 0);
$product = $id ? db_one('SELECT * FROM products WHERE id = ?', [$id]) : null;
if ($id && !$product) {
    flash('Product not found.', 'error');
    redirect('/admin/products.php');
}

$errors = [];
if (is_post()) {
    verify_csrf();
    $data = [
        'name'        => post_str('name', 160),
        'category_id' => (int) ($_POST['category_id'] ?? 0),
        'description' => post_str('description', 2000),
        'price'       => post_money('price') ?? 0,
        'sale_price'  => post_money('sale_price'),
        'is_active'   => empty($_POST['is_active']) ? 0 : 1,
        'is_featured' => empty($_POST['is_featured']) ? 0 : 1,
    ];
    if ($data['name'] === '') {
        $errors[] = 'Please enter a product name.';
    }
    if (!db_one('SELECT id FROM categories WHERE id = ?', [$data['category_id']])) {
        $errors[] = 'Please choose a category.';
    }
    if ($data['sale_price'] !== null && $data['price'] > 0 && $data['sale_price'] >= $data['price']) {
        $errors[] = 'Sale price must be lower than the normal price (or leave it empty).';
    }

    if (!$errors) {
        if ($product) {
            $data['slug'] = unique_slug('products', $data['name'], $id);
            db_update('products', $id, $data);
        } else {
            $data['slug'] = unique_slug('products', $data['name']);
            $data['created_at'] = now();
            $data['sort'] = 0;
            $id = db_insert('products', $data);
        }

        // Image actions: delete / make main
        $imgAction = (string) ($_POST['img_action'] ?? '');
        if (preg_match('/^(delete|main):(\d+)$/', $imgAction, $m)) {
            $img = db_one('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [(int) $m[2], $id]);
            if ($img && $m[1] === 'delete') {
                image_delete($img['path'], $img['thumb_path']);
                q('DELETE FROM product_images WHERE id = ?', [$img['id']]);
            } elseif ($img && $m[1] === 'main') {
                q('UPDATE product_images SET sort = sort + 1 WHERE product_id = ?', [$id]);
                q('UPDATE product_images SET sort = 0 WHERE id = ?', [$img['id']]);
            }
        }

        // New uploads
        $nextSort = (int) db_value('SELECT COALESCE(MAX(sort), -1) + 1 FROM product_images WHERE product_id = ?', [$id]);
        foreach (uploaded_files('images') as $file) {
            try {
                [$path, $thumb] = image_store($file['tmp_name']);
                db_insert('product_images', ['product_id' => $id, 'path' => $path, 'thumb_path' => $thumb, 'sort' => $nextSort++]);
            } catch (Throwable $ex) {
                flash($file['name'] . ': ' . $ex->getMessage(), 'error');
            }
        }

        flash($product ? 'Product updated.' : 'Product added.');
        redirect(isset($_POST['save_close']) ? '/admin/products.php' : '/admin/product-edit.php?id=' . $id);
    }
    $product = array_merge($product ?? [], $data);
}

$images = $id ? db_all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort, id', [$id]) : [];
$p = $product ?? ['name' => '', 'category_id' => (int) ($_GET['cat'] ?? 0), 'description' => '', 'price' => '', 'sale_price' => null, 'is_active' => 1, 'is_featured' => 0];

admin_header($id ? 'Edit product' : 'Add product', 'products');
?>
<div class="page-head">
  <h1><?= $id ? 'Edit product' : 'Add product' ?></h1>
  <div class="actions">
    <?php if ($id && !empty($product['slug'])): ?><a class="btn ghost" target="_blank" href="/product/<?= e($product['slug']) ?>">View on site ↗</a><?php endif; ?>
    <a class="btn ghost" href="/admin/products.php">← All products</a>
  </div>
</div>

<?php foreach ($errors as $err): ?><div class="flash error"><?= e($err) ?></div><?php endforeach; ?>

<form class="card form-grid" method="post" enctype="multipart/form-data">
  <?= csrf_field() ?>
  <button type="submit" class="default-submit" tabindex="-1" aria-hidden="true"></button>
  <div class="col">
    <label>Product name <input name="name" value="<?= e($p['name']) ?>" required placeholder="e.g. 25 Red Roses Bouquet"></label>
    <label>Category
      <select name="category_id" required>
        <option value="">Choose…</option>
        <?php foreach (category_options() as $c): ?>
          <option value="<?= (int) $c['id'] ?>" <?= (int) $p['category_id'] === (int) $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <div class="two">
      <label>Price (₹) <input type="number" name="price" min="0" step="1" value="<?= e($p['price']) ?>" placeholder="0 = Ask for price"></label>
      <label>Sale price (₹) <input type="number" name="sale_price" min="0" step="1" value="<?= e($p['sale_price'] ?? '') ?>" placeholder="optional"></label>
    </div>
    <label>Description <textarea name="description" rows="5" placeholder="Flowers used, size, what’s included…"><?= e($p['description']) ?></textarea></label>
    <div class="toggles">
      <label class="check"><input type="checkbox" name="is_active" value="1" <?= $p['is_active'] ? 'checked' : '' ?>> Visible on website</label>
      <label class="check"><input type="checkbox" name="is_featured" value="1" <?= $p['is_featured'] ? 'checked' : '' ?>> Show on home page (featured)</label>
    </div>
  </div>

  <div class="col">
    <h3>Photos</h3>
    <div class="image-grid">
      <?php foreach ($images as $i => $img): ?>
        <figure class="<?= $i === 0 ? 'main' : '' ?>">
          <img src="/<?= e($img['thumb_path']) ?>" alt="">
          <figcaption>
            <?php if ($i === 0): ?><span class="pill">Main</span><?php else: ?>
              <button class="btn small ghost" name="img_action" value="main:<?= (int) $img['id'] ?>">Make main</button>
            <?php endif; ?>
            <button class="btn small danger" name="img_action" value="delete:<?= (int) $img['id'] ?>" onclick="return confirm('Delete this photo?')">✕</button>
          </figcaption>
        </figure>
      <?php endforeach; ?>
    </div>
    <label class="dropzone">
      <input type="file" name="images[]" accept="image/jpeg,image/png,image/webp" multiple data-preview>
      <span><b>Tap to add photos</b><br><small>JPG / PNG / WebP · you can pick several · first photo is the main one</small></span>
    </label>
    <div class="upload-preview"></div>
  </div>

  <div class="form-actions">
    <button class="btn" type="submit" name="save_close" value="1">Save</button>
    <button class="btn ghost" type="submit">Save & keep editing</button>
  </div>
</form>
<?php admin_footer();
