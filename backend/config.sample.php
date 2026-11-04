<?php
/**
 * Copy this file to config.php and fill in your values.
 * config.php is never committed to git and never overwritten by deploys.
 *
 * On Hostinger: hPanel → Databases → MySQL Databases → create a database,
 * then put the database name / user / password below and set driver to 'mysql'.
 */
return [
    'db' => [
        'driver'      => 'sqlite',                 // 'mysql' on Hostinger, 'sqlite' for local dev
        'sqlite_path' => __DIR__ . '/database/cityflorist.sqlite',
        'host'        => 'localhost',
        'name'        => 'u000000000_cityflorist',
        'user'        => 'u000000000_admin',
        'pass'        => 'your-database-password',
        'charset'     => 'utf8mb4',
    ],

    // Public URL of the site, no trailing slash. Used in WhatsApp messages (photo links).
    'site_url' => 'http://localhost:5173',

    // First admin login, created by /admin/install.php. Change the password after first login.
    'admin' => [
        'username' => 'admin',
        'password' => 'ChangeMe@123',
    ],

    // Default owner WhatsApp number (country code + number, digits only). Editable later in Admin → Settings.
    'whatsapp_number' => '919999999999',

    'timezone' => 'Asia/Kolkata',
    'debug'    => true, // set to false on the live server
];
