<?php
require __DIR__ . '/_boot.php';

if (!db_installed()) {
    redirect('/admin/install.php');
}
if (current_admin()) {
    redirect('/admin/');
}

$error = null;
if (is_post()) {
    verify_csrf();
    if (!rate_limit('login', 8, 15)) {
        $error = 'Too many attempts. Please wait 15 minutes and try again.';
    } elseif (attempt_login(trim($_POST['username'] ?? ''), (string) ($_POST['password'] ?? ''))) {
        clear_attempts('login');
        redirect('/admin/');
    } else {
        $error = 'Wrong username or password.';
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Login · City Florist Admin</title>
  <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body class="auth">
  <form class="auth-card" method="post" autocomplete="on">
    <h1 class="script">City Florist</h1>
    <p class="muted">Shop owner login</p>
    <?php if ($error): ?><div class="flash error"><?= e($error) ?></div><?php endif; ?>
    <?= csrf_field() ?>
    <label>Username <input name="username" required autofocus autocomplete="username"></label>
    <label>Password <input name="password" type="password" required autocomplete="current-password"></label>
    <button class="btn" type="submit">Log in</button>
  </form>
</body>
</html>
