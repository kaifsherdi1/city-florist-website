<?php
declare(strict_types=1);

define('ROOT', dirname(__DIR__));
define('UPLOAD_DIR', ROOT . '/uploads');

$configFile = ROOT . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Missing config.php. Copy config.sample.php to config.php and fill in your settings.');
}
$GLOBALS['config'] = require $configFile;

date_default_timezone_set(config('timezone', 'Asia/Kolkata'));

if (config('debug')) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
}

require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';
require __DIR__ . '/catalog.php';

function config(string $key, $default = null)
{
    $value = $GLOBALS['config'];
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}
