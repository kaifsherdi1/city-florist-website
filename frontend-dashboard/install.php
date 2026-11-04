<?php
/**
 * One-time installer. Creates the tables, the first admin login, the five categories
 * and the starter products from database/seed. Locks itself once an admin exists.
 */
require __DIR__ . '/_boot.php';

if (db_installed()) {
    redirect('/admin/login.php');
}

$log = [];
$error = null;

if (is_post()) {
    try {
        foreach (schema_sql() as $sql) {
            db()->exec($sql);
        }
        $log[] = 'Tables created';

        db_insert('admins', [
            'username'      => config('admin.username', 'admin'),
            'password_hash' => password_hash(config('admin.password', 'ChangeMe@123'), PASSWORD_DEFAULT),
            'created_at'    => now(),
        ]);
        $log[] = 'Admin login created';

        $catIds = [];
        foreach (default_categories() as $i => [$slug, $name, $tagline]) {
            $existing = db_one('SELECT id FROM categories WHERE slug = ?', [$slug]);
            $catIds[$slug] = $existing ? (int) $existing['id'] : db_insert('categories', [
                'slug' => $slug, 'name' => $name, 'tagline' => $tagline, 'sort' => $i,
            ]);
        }
        $log[] = 'Categories created';

        foreach (setting_defaults() as $k => $v) {
            save_setting($k, $v);
        }

        if (!empty($_POST['seed'])) {
            $manifest = json_decode((string) @file_get_contents(ROOT . '/database/seed/manifest.json'), true) ?: [];
            $featured = [
                'flower-bouquets/01', 'flower-bouquets/04', 'flower-bouquets/14', 'flower-bouquets/20',
                'chocolate-bouquets/16', 'chocolate-bouquets/18', 'chocolate-bouquets/10',
                'car-decoration/07', 'garlands/09', 'garlands/10',
            ];
            $count = 0;
            foreach ($manifest as $i => $item) {
                $src = ROOT . '/database/seed/' . $item['image'];
                $srcThumb = ROOT . '/database/seed/' . $item['thumb'];
                if (!is_file($src) || !isset($catIds[$item['category']])) {
                    continue;
                }
                $dir = UPLOAD_DIR . '/products';
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                $base = $item['category'] . '-' . pathinfo($item['image'], PATHINFO_FILENAME);
                copy($src, "$dir/$base.webp");
                copy($srcThumb, "$dir/$base-thumb.webp");

                $key = $item['category'] . '/' . pathinfo($item['image'], PATHINFO_FILENAME);
                $pid = db_insert('products', [
                    'category_id' => $catIds[$item['category']],
                    'name'        => $item['name'],
                    'slug'        => unique_slug('products', $item['name']),
                    'description' => 'Handcrafted fresh at City Florist, Hubballi. Message us to customise colours, size or add a card.',
                    'price'       => 0,
                    'is_featured' => in_array($key, $featured, true) ? 1 : 0,
                    'is_active'   => 1,
                    'sort'        => $i,
                    'created_at'  => now(),
                ]);
                db_insert('product_images', [
                    'product_id' => $pid,
                    'path'       => "uploads/products/$base.webp",
                    'thumb_path' => "uploads/products/$base-thumb.webp",
                    'sort'       => 0,
                ]);
                $count++;
            }
            $log[] = "$count starter products imported";
        }
    } catch (Throwable $ex) {
        $error = $ex->getMessage();
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Install · City Florist</title>
  <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body class="auth">
  <form class="auth-card" method="post">
    <h1 class="script">City Florist</h1>
    <p class="muted">Website installer</p>
    <?php if ($error): ?>
      <div class="flash error"><?= e($error) ?></div>
    <?php endif; ?>
    <?php if ($log && !$error): ?>
      <ul class="install-log"><?php foreach ($log as $l): ?><li>✓ <?= e($l) ?></li><?php endforeach; ?></ul>
      <p>Log in with username <b><?= e(config('admin.username')) ?></b> and the password from <code>config.php</code>, then change the password in Settings.</p>
      <a class="btn" href="/admin/login.php">Go to login</a>
    <?php else: ?>
      <p>Database: <b><?= e(db_driver()) ?></b></p>
      <label class="check"><input type="checkbox" name="seed" value="1" checked> Import the starter product photos</label>
      <button class="btn" type="submit">Install</button>
    <?php endif; ?>
  </form>
</body>
</html>
