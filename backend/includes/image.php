<?php
declare(strict_types=1);

const IMAGE_MAX = 1600;
const THUMB_MAX = 640;

function image_load(string $file)
{
    $info = @getimagesize($file);
    if (!$info) {
        throw new RuntimeException('Not a valid image file.');
    }
    switch ($info[2]) {
        case IMAGETYPE_JPEG:
            $img = imagecreatefromjpeg($file);
            if ($img && function_exists('exif_read_data')) {
                $exif = @exif_read_data($file);
                $rotate = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
                if ($rotate) {
                    $img = imagerotate($img, $rotate, 0);
                }
            }
            return $img;
        case IMAGETYPE_PNG:
            return imagecreatefrompng($file);
        case IMAGETYPE_WEBP:
            return imagecreatefromwebp($file);
        case IMAGETYPE_GIF:
            return imagecreatefromgif($file);
    }
    throw new RuntimeException('Please upload a JPG, PNG or WebP image.');
}

function image_resize($src, int $max)
{
    $w = imagesx($src);
    $h = imagesy($src);
    $scale = min(1, $max / max($w, $h));
    $nw = (int) round($w * $scale);
    $nh = (int) round($h * $scale);
    $dst = imagecreatetruecolor($nw, $nh);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    return $dst;
}

/**
 * Saves an uploaded/source image as a large WebP plus a thumbnail.
 * Returns paths relative to the site root, e.g. ['uploads/products/ab12.webp', 'uploads/products/ab12-thumb.webp'].
 */
function image_store(string $sourceFile, string $subdir = 'products', ?string $baseName = null): array
{
    $dirRel = 'uploads/' . trim($subdir, '/');
    $dirAbs = ROOT . '/' . $dirRel;
    if (!is_dir($dirAbs) && !mkdir($dirAbs, 0755, true)) {
        throw new RuntimeException('Cannot create upload folder.');
    }
    $name = $baseName ?: date('Ymd') . '-' . bin2hex(random_bytes(5));

    $src = image_load($sourceFile);
    $large = image_resize($src, IMAGE_MAX);
    $thumb = image_resize($src, THUMB_MAX);

    $path = "$dirRel/$name.webp";
    $thumbPath = "$dirRel/$name-thumb.webp";
    imagewebp($large, ROOT . '/' . $path, 82);
    imagewebp($thumb, ROOT . '/' . $thumbPath, 78);

    imagedestroy($src);
    imagedestroy($large);
    imagedestroy($thumb);

    return [$path, $thumbPath];
}

function image_delete(?string ...$paths): void
{
    foreach ($paths as $p) {
        if ($p && str_starts_with($p, 'uploads/') && is_file(ROOT . '/' . $p)) {
            @unlink(ROOT . '/' . $p);
        }
    }
}

/** Normalises $_FILES['x'] (single or multiple) into a flat list of uploads that succeeded. */
function uploaded_files(string $field): array
{
    if (empty($_FILES[$field])) {
        return [];
    }
    $f = $_FILES[$field];
    $list = [];
    if (is_array($f['name'])) {
        foreach ($f['name'] as $i => $n) {
            $list[] = ['name' => $n, 'tmp_name' => $f['tmp_name'][$i], 'error' => $f['error'][$i], 'size' => $f['size'][$i]];
        }
    } else {
        $list[] = $f;
    }
    return array_values(array_filter($list, fn($x) => $x['error'] === UPLOAD_ERR_OK && is_uploaded_file($x['tmp_name'])));
}
