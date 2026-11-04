<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_layout.php';
$admin = require_admin();

$fields = [
    'whatsapp_number' => ['WhatsApp number for orders', 'Country code + number, e.g. 919876543210'],
    'shop_phone'      => ['Shop phone (for Call button)', 'e.g. +91 98765 43210'],
    'email'           => ['Email', ''],
    'address'         => ['Shop address', ''],
    'hours'           => ['Opening hours', 'e.g. Open daily · 8:00 AM – 10:00 PM'],
    'map_embed'       => ['Google Maps embed link', 'Google Maps → Share → Embed a map → copy only the src="…" link'],
    'instagram'       => ['Instagram link', 'https://instagram.com/…'],
    'facebook'        => ['Facebook link', ''],
    'hero_title'      => ['Home page headline', ''],
    'hero_subtitle'   => ['Home page intro line', ''],
];

if (is_post()) {
    verify_csrf();
    $section = $_POST['section'] ?? '';

    if ($section === 'shop') {
        foreach ($fields as $key => $_) {
            $value = post_str($key, 1000);
            if ($key === 'whatsapp_number') {
                $value = whatsapp_digits($value);
                if (strlen($value) === 10) {
                    $value = '91' . $value;
                }
            }
            if ($key === 'map_embed' && preg_match('/src="([^"]+)"/', $value, $m)) {
                $value = $m[1];
            }
            save_setting($key, $value);
        }
        flash('Shop details saved.');
    }

    if ($section === 'categories') {
        foreach ((array) ($_POST['cat'] ?? []) as $id => $c) {
            db_update('categories', (int) $id, [
                'name'    => mb_substr(trim((string) $c['name']), 0, 120) ?: 'Category',
                'tagline' => mb_substr(trim((string) $c['tagline']), 0, 255),
                'sort'    => (int) $c['sort'],
            ]);
        }
        foreach (array_keys((array) ($_FILES['cover']['name'] ?? [])) as $id) {
            if (($_FILES['cover']['error'][$id] ?? 1) === UPLOAD_ERR_OK && is_uploaded_file($_FILES['cover']['tmp_name'][$id])) {
                try {
                    [$path, $thumb] = image_store($_FILES['cover']['tmp_name'][$id], 'categories');
                    image_delete($thumb, db_value('SELECT cover_image FROM categories WHERE id = ?', [(int) $id]));
                    db_update('categories', (int) $id, ['cover_image' => $path]);
                } catch (Throwable $ex) {
                    flash('Cover: ' . $ex->getMessage(), 'error');
                }
            }
        }
        flash('Categories saved.');
    }

    if ($section === 'password') {
        $row = db_one('SELECT * FROM admins WHERE id = ?', [$admin['id']]);
        $new = (string) ($_POST['new_password'] ?? '');
        if (!password_verify((string) ($_POST['current_password'] ?? ''), $row['password_hash'])) {
            flash('Current password is wrong.', 'error');
        } elseif (strlen($new) < 8) {
            flash('New password must be at least 8 characters.', 'error');
        } elseif ($new !== ($_POST['confirm_password'] ?? '')) {
            flash('The two new passwords do not match.', 'error');
        } else {
            db_update('admins', $admin['id'], ['password_hash' => password_hash($new, PASSWORD_DEFAULT)]);
            flash('Password changed.');
        }
    }
    redirect('/admin/settings.php');
}

$s = settings();
$cats = db_all('SELECT * FROM categories ORDER BY sort, id');

admin_header('Settings', 'settings');
?>
<div class="page-head"><h1>Settings</h1></div>

<form class="card" method="post">
  <?= csrf_field() ?>
  <input type="hidden" name="section" value="shop">
  <h2>Shop details</h2>
  <div class="grid-2">
    <?php foreach ($fields as $key => [$label, $hint]): ?>
      <label class="<?= in_array($key, ['map_embed', 'hero_subtitle', 'address'], true) ? 'full' : '' ?>"><?= e($label) ?>
        <?php if (in_array($key, ['hero_subtitle', 'address'], true)): ?>
          <textarea name="<?= $key ?>" rows="2"><?= e($s[$key] ?? '') ?></textarea>
        <?php else: ?>
          <input name="<?= $key ?>" value="<?= e($s[$key] ?? '') ?>" <?= $key === 'whatsapp_number' ? 'required inputmode="numeric"' : '' ?>>
        <?php endif; ?>
        <?php if ($hint): ?><small class="muted"><?= e($hint) ?></small><?php endif; ?>
      </label>
    <?php endforeach; ?>
  </div>
  <div class="form-actions"><button class="btn">Save shop details</button></div>
</form>

<form class="card" method="post" enctype="multipart/form-data">
  <?= csrf_field() ?>
  <input type="hidden" name="section" value="categories">
  <h2>Categories</h2>
  <p class="muted small">If no cover photo is uploaded, the first product photo of that category is used.</p>
  <?php foreach ($cats as $c): ?>
    <div class="cat-row">
      <?php if ($c['cover_image']): ?><img src="/<?= e($c['cover_image']) ?>" alt=""><?php else: ?><span class="noimg">Auto</span><?php endif; ?>
      <input name="cat[<?= (int) $c['id'] ?>][name]" value="<?= e($c['name']) ?>" aria-label="Name">
      <input name="cat[<?= (int) $c['id'] ?>][tagline]" value="<?= e($c['tagline']) ?>" aria-label="Tagline" class="grow">
      <input name="cat[<?= (int) $c['id'] ?>][sort]" type="number" value="<?= (int) $c['sort'] ?>" aria-label="Order" class="tiny">
      <input type="file" name="cover[<?= (int) $c['id'] ?>]" accept="image/jpeg,image/png,image/webp" aria-label="Cover">
    </div>
  <?php endforeach; ?>
  <div class="form-actions"><button class="btn">Save categories</button></div>
</form>

<form class="card narrow" method="post">
  <?= csrf_field() ?>
  <input type="hidden" name="section" value="password">
  <h2>Change password</h2>
  <label>Current password <input type="password" name="current_password" required autocomplete="current-password"></label>
  <label>New password <input type="password" name="new_password" required minlength="8" autocomplete="new-password"></label>
  <label>Repeat new password <input type="password" name="confirm_password" required minlength="8" autocomplete="new-password"></label>
  <div class="form-actions"><button class="btn">Change password</button></div>
</form>
<?php admin_footer();
