<?php
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $c = config('db');
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    if ($c['driver'] === 'sqlite') {
        $pdo = new PDO('sqlite:' . $c['sqlite_path'], null, null, $options);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
    } else {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $c['host'], $c['name'], $c['charset'] ?? 'utf8mb4');
        $pdo = new PDO($dsn, $c['user'], $c['pass'], $options);
        $pdo->exec("SET time_zone = '" . (new DateTime())->format('P') . "'");
    }
    return $pdo;
}

function db_driver(): string
{
    return config('db.driver');
}

function q(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function db_all(string $sql, array $params = []): array
{
    return q($sql, $params)->fetchAll();
}

function db_one(string $sql, array $params = []): ?array
{
    $row = q($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function db_value(string $sql, array $params = [])
{
    $v = q($sql, $params)->fetchColumn();
    return $v === false ? null : $v;
}

function db_insert(string $table, array $data): int
{
    $cols = array_keys($data);
    $sql = sprintf(
        'INSERT INTO %s (%s) VALUES (%s)',
        $table,
        implode(', ', $cols),
        implode(', ', array_map(fn($c) => ':' . $c, $cols))
    );
    q($sql, $data);
    return (int) db()->lastInsertId();
}

function db_update(string $table, int $id, array $data): void
{
    $set = implode(', ', array_map(fn($c) => "$c = :$c", array_keys($data)));
    $data['id'] = $id;
    q("UPDATE $table SET $set WHERE id = :id", $data);
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

/** Table definitions shared by MySQL and SQLite. */
function schema_sql(): array
{
    $mysql = db_driver() === 'mysql';
    $pk    = $mysql ? 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $fk    = $mysql ? 'INT UNSIGNED' : 'INTEGER';
    $dt    = $mysql ? 'DATETIME' : 'TEXT';
    $tail  = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';

    return [
        "CREATE TABLE IF NOT EXISTS admins (
            id $pk,
            username VARCHAR(60) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at $dt NOT NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS categories (
            id $pk,
            slug VARCHAR(80) NOT NULL UNIQUE,
            name VARCHAR(120) NOT NULL,
            tagline VARCHAR(255) NULL,
            cover_image VARCHAR(255) NULL,
            sort INT NOT NULL DEFAULT 0
        )$tail",
        "CREATE TABLE IF NOT EXISTS products (
            id $pk,
            category_id $fk NOT NULL,
            name VARCHAR(160) NOT NULL,
            slug VARCHAR(180) NOT NULL UNIQUE,
            description TEXT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            sale_price DECIMAL(10,2) NULL,
            is_featured TINYINT NOT NULL DEFAULT 0,
            is_active TINYINT NOT NULL DEFAULT 1,
            sort INT NOT NULL DEFAULT 0,
            created_at $dt NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )$tail",
        "CREATE TABLE IF NOT EXISTS product_images (
            id $pk,
            product_id $fk NOT NULL,
            path VARCHAR(255) NOT NULL,
            thumb_path VARCHAR(255) NOT NULL,
            sort INT NOT NULL DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )$tail",
        "CREATE TABLE IF NOT EXISTS offers (
            id $pk,
            title VARCHAR(160) NOT NULL,
            subtitle VARCHAR(255) NULL,
            discount_pct INT NOT NULL DEFAULT 0,
            product_id $fk NULL,
            category_id $fk NULL,
            image VARCHAR(255) NULL,
            starts_at $dt NOT NULL,
            ends_at $dt NOT NULL,
            is_active TINYINT NOT NULL DEFAULT 1,
            created_at $dt NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS orders (
            id $pk,
            product_id $fk NULL,
            product_name VARCHAR(160) NOT NULL,
            price_at_order DECIMAL(10,2) NOT NULL DEFAULT 0,
            customer_name VARCHAR(120) NOT NULL,
            customer_phone VARCHAR(20) NOT NULL,
            note TEXT NULL,
            delivery_date VARCHAR(20) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'new',
            created_at $dt NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS settings (
            name VARCHAR(80) NOT NULL PRIMARY KEY,
            value TEXT NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS attempts (
            id $pk,
            ip VARCHAR(64) NOT NULL,
            action VARCHAR(30) NOT NULL,
            created_at $dt NOT NULL
        )$tail",
    ];
}

function db_installed(): bool
{
    try {
        return (int) db_value('SELECT COUNT(*) FROM admins') > 0;
    } catch (PDOException $e) {
        return false;
    }
}
