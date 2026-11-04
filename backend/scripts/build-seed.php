<?php
/**
 * Converts the client's raw photos in /images into optimised WebP seed files
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
];

$seedDir = ROOT . '/database/seed';
$manifest = [];

foreach ($map as $folder => [$slug, $label]) {
    $files = glob(ROOT . "/images/$folder/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}", GLOB_BRACE);
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
        $manifest[] = [
            'category' => $slug,
            'name'     => "$label No. $n",
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

file_put_contents("$seedDir/manifest.json", json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo count($manifest) . " images written to database/seed\n";
