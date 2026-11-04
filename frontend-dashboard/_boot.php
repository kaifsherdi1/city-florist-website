<?php
// Finds the backend: ../includes on the live server, ../backend/includes in the repo during local development.
$bootstrap = is_file(__DIR__ . '/../includes/bootstrap.php')
    ? __DIR__ . '/../includes/bootstrap.php'
    : __DIR__ . '/../backend/includes/bootstrap.php';
require $bootstrap;
require_once ROOT . '/includes/auth.php';
