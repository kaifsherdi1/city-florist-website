<?php
declare(strict_types=1);

require_once ROOT . '/includes/auth.php';
require_once ROOT . '/includes/image.php';

function admin_header(string $title, string $active = ''): void
{
    $admin = current_admin();
    $newOrders = (int) db_value("SELECT COUNT(*) FROM orders WHERE status = 'new'");
    $nav = [
        'dashboard' => ['/admin/', 'Dashboard'],
        'products'  => ['/admin/products.php', 'Products'],
        'offers'    => ['/admin/offers.php', 'Daily Offers'],
        'orders'    => ['/admin/orders.php', 'Orders'],
        'settings'  => ['/admin/settings.php', 'Settings'],
    ];
    ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title><?= e($title) ?> · City Florist Admin</title>
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body>
<header class="topbar">
  <a class="brand script" href="/admin/">City Florist</a>
  <button class="menu-toggle" type="button" onclick="document.body.classList.toggle('nav-open')" aria-label="Menu">☰</button>
  <nav class="nav">
    <?php foreach ($nav as $key => [$href, $label]): ?>
      <a href="<?= $href ?>" class="<?= $active === $key ? 'active' : '' ?>">
        <?= e($label) ?><?php if ($key === 'orders' && $newOrders): ?><span class="badge"><?= $newOrders ?></span><?php endif; ?>
      </a>
    <?php endforeach; ?>
    <a href="/" target="_blank">View site ↗</a>
    <a href="/admin/logout.php" class="muted">Logout (<?= e($admin['username'] ?? '') ?>)</a>
  </nav>
</header>
<main class="wrap">
  <?php foreach (take_flashes() as $f): ?>
    <div class="flash <?= e($f['type']) ?>"><?= e($f['message']) ?></div>
  <?php endforeach; ?>
    <?php
}

function admin_footer(): void
{
    ?>
</main>
<script src="/admin/assets/admin.js"></script>
</body>
</html>
    <?php
}

/** Reads a money field from POST; empty string → null. */
function post_money(string $key): ?float
{
    $v = trim((string) ($_POST[$key] ?? ''));
    if ($v === '') {
        return null;
    }
    return max(0, round((float) str_replace(',', '', $v), 2));
}

function post_str(string $key, int $max = 255): string
{
    return mb_substr(trim((string) ($_POST[$key] ?? '')), 0, $max);
}

function category_options(): array
{
    return db_all('SELECT id, name, slug FROM categories ORDER BY sort, id');
}

function dt_local(?string $dt): string
{
    return $dt ? date('Y-m-d\TH:i', strtotime($dt)) : '';
}
