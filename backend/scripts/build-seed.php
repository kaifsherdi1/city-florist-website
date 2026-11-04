<?php
/**
 * Converts the client's raw photos in the repo-root images/ folder into optimised WebP seed files
 * (database/seed/<category>/NN.webp + NN-thumb.webp) and a manifest.json that
 * /admin/install.php uses to create the starting products.
 *
 * Run locally: php scripts/build-seed.php
 */
declare(strict_types=1);

define('ROOT', dirname(__DIR__));
require ROOT . '/includes/image.php';

$map = [
    'flower-bouque'         => ['flower-bouquets',    'Flower Bouquet'],
    'chocolate-bouque'      => ['chocolate-bouquets', 'Chocolate Bouquet'],
    'car-decoration-images' => ['car-decoration',     'Car Decoration'],
    'garland-flowers'       => ['garlands',           'Bridal Garland'],
    'room-decoration'       => ['room-decoration',    'Room Decoration'],
];

$seedDir = ROOT . '/database/seed';
$manifest = [];

foreach ($map as $folder => [$slug, $label]) {
    $files = glob(dirname(ROOT) . "/images/$folder/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}", GLOB_BRACE);
    sort($files, SORT_NATURAL);
    $out = "$seedDir/$slug";
    if (!is_dir($out)) {
        mkdir($out, 0755, true);
    }
    foreach ($files as $i => $file) {
        $n = str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT);
        $src = image_load($file);
        $large = image_resize($src, IMAGE_MAX);
        $thumb = image_resize($src, THUMB_MAX);
        imagewebp($large, "$out/$n.webp", 80);
        imagewebp($thumb, "$out/$n-thumb.webp", 76);
        // "03-champagne-and-candles-surprise.jpg" → "Champagne & Candles Surprise". Anything else
        // (e.g. "WhatsApp Image 2026-….jpeg") keeps the numbered "Label No. NN".
        $base = pathinfo($file, PATHINFO_FILENAME);
        $name = preg_match('/^\d+-([a-z][a-z-]+)$/i', $base, $m)
            ? str_replace([' And ', ' Decor'], [' & ', ' Décor'], ucwords(str_replace('-', ' ', $m[1])))
            : "$label No. $n";
        $manifest[] = [
            'category' => $slug,
            'name'     => $name,
            'image'    => "$slug/$n.webp",
            'thumb'    => "$slug/$n-thumb.webp",
            'w'        => imagesx($large),
            'h'        => imagesy($large),
        ];
        imagedestroy($src);
        imagedestroy($large);
        imagedestroy($thumb);
        echo "✓ $slug/$n\n";
    }
}

if (!$manifest) {
    exit("No photos found in images/ — manifest left unchanged.\n");
}
file_put_contents("$seedDir/manifest.json", json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo count($manifest) . " images written to database/seed\n";
