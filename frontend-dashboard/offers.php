<?php
require __DIR__ . '/_boot.php';
require __DIR__ . '/_layout.php';
require_admin();

$editId = (int) ($_GET['edit'] ?? 0);
$editing = $editId ? db_one('SELECT * FROM offers WHERE id = ?', [$editId]) : null;

if (is_post()) {
    verify_csrf();
    $action = $_POST['action'] ?? 'save';

    if ($action === 'delete') {
        $o = db_one('SELECT * FROM offers WHERE id = ?', [(int) $_POST['id']]);
        if ($o) {
            image_delete($o['image']);
            q('DELETE FROM offers WHERE id = ?', [$o['id']]);
            flash('Offer deleted.');
        }
        redirect('/admin/offers.php');
    }

    if ($action === 'toggle') {
        q('UPDATE offers SET is_active = 1 - is_active WHERE id = ?', [(int) $_POST['id']]);
        redirect('/admin/offers.php');
    }

    [$targetType, $targetId] = array_pad(explode(':', (string) ($_POST['target'] ?? 'all')), 2, 0);
    $data = [
        'title'        => post_str('title', 160),
        'subtitle'     => post_str('subtitle', 255),
        'discount_pct' => max(0, min(90, (int) ($_POST['discount_pct'] ?? 0))),
        'product_id'   => $targetType === 'product' ? (int) $targetId : null,
        'category_id'  => $targetType === 'category' ? (int) $targetId : null,
        'starts_at'    => date('Y-m-d H:i:s', strtotime((string) ($_POST['starts_at'] ?? 'now')) ?: time()),
        'ends_at'      => date('Y-m-d H:i:s', strtotime((string) ($_POST['ends_at'] ?? 'today 23:59')) ?: strtotime('today 23:59')),
        'is_active'    => empty($_POST['is_active']) ? 0 : 1,
    ];
    if ($data['title'] === '') {
        flash('Please give the offer a title.', 'error');
        redirect('/admin/offers.php' . ($editId ? "?edit=$editId" : '') . '#new');
    }
    if ($data['ends_at'] <= $data['starts_at']) {
        flash('The end time must be after the start time.', 'error');
        redirect('/admin/offers.php' . ($editId ? "?edit=$editId" : '') . '#new');
    }

    $files = uploaded_files('image');
    if ($files) {
        try {
            [$path, $thumb] = image_store($files[0]['tmp_name'], 'offers');
            image_delete($thumb);
            if ($editing) {
                image_delete($editing['image']);
            }
            $data['image'] = $path;
        } catch (Throwable $ex) {
            flash('Image: ' . $ex->getMessage(), 'error');
        }
    }

    if ($editing) {
        db_update('offers', $editId, $data);
        flash('Offer updated.');
    } else {
        $data['created_at'] = now();
        db_insert('offers', $data);
        flash('Offer published.');
    }
    redirect('/admin/offers.php');
}

$offers = db_all(
    'SELECT o.*, p.name AS product_name, c.name AS category_name FROM offers o
     LEFT JOIN products p ON p.id = o.product_id LEFT JOIN categories c ON c.id = o.category_id
     ORDER BY o.ends_at DESC'
);
$products = db_all('SELECT id, name FROM products WHERE is_active = 1 ORDER BY name');
$o = $editing ?? [
    'title' => '', 'subtitle' => '', 'discount_pct' => 10, 'product_id' => null, 'category_id' => null,
    'starts_at' => now(), 'ends_at' => date('Y-m-d 23:59:00'), 'is_active' => 1, 'image' => null,
];
$target = $o['product_id'] ? 'product:' . $o['product_id'] : ($o['category_id'] ? 'category:' . $o['category_id'] : 'all');

function offer_state(array $o): string
{
    if (!$o['is_active']) return 'paused';
    if ($o['ends_at'] < now()) return 'ended';
    if ($o['starts_at'] > now()) return 'scheduled';
    return 'live';
}

admin_header('Daily Offers', 'offers');
?>
<div class="page-head">
  <h1>Daily Offers</h1>
</div>
<p class="muted">Offers show in the gold banner on the home page and automatically reduce prices. They switch off by themselves at the end time.</p>

<section class="card">
  <?php if (!$offers): ?>
    <p class="muted">No offers yet. Create your first one below.</p>
  <?php else: ?>
    <div class="table-scroll"><table>
      <thead><tr><th>Offer</th><th>Discount</th><th>Applies to</th><th>Runs</th><th>Status</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($offers as $row): $state = offer_state($row); ?>
        <tr>
          <td><b><?= e($row['title']) ?></b><br><small class="muted"><?= e($row['subtitle']) ?></small></td>
          <td><?= (int) $row['discount_pct'] ?>%</td>
          <td><?= e($row['product_name'] ?: ($row['category_name'] ?: 'Everything')) ?></td>
          <td class="small"><?= e(date('d M h:i A', strtotime($row['starts_at']))) ?><br>→ <?= e(date('d M h:i A', strtotime($row['ends_at']))) ?></td>
          <td><span class="pill <?= $state ?>"><?= $state ?></span></td>
          <td class="nowrap">
            <a class="btn small ghost" href="?edit=<?= (int) $row['id'] ?>#new">Edit</a>
            <form method="post" class="inline"><?= csrf_field() ?><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int) $row['id'] ?>"><button class="btn small ghost"><?= $row['is_active'] ? 'Pause' : 'Resume' ?></button></form>
            <form method="post" class="inline" onsubmit="return confirm('Delete this offer?')"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $row['id'] ?>"><button class="btn small danger">✕</button></form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table></div>
  <?php endif; ?>
</section>

<form id="new" class="card form-grid" method="post" enctype="multipart/form-data">
  <?= csrf_field() ?>
  <h2 class="full"><?= $editing ? 'Edit offer' : 'New offer' ?></h2>
  <div class="col">
    <label>Title <input name="title" value="<?= e($o['title']) ?>" required placeholder="e.g. Valentine’s Rose Week"></label>
    <label>Short line <input name="subtitle" value="<?= e($o['subtitle']) ?>" placeholder="e.g. Flat 20% off on all red rose bouquets"></label>
    <div class="two">
      <label>Discount % <input type="number" name="discount_pct" min="0" max="90" value="<?= (int) $o['discount_pct'] ?>"></label>
      <label>Applies to
        <select name="target">
          <option value="all" <?= $target === 'all' ? 'selected' : '' ?>>Everything</option>
          <optgroup label="Category">
            <?php foreach (category_options() as $c): ?>
              <option value="category:<?= (int) $c['id'] ?>" <?= $target === 'category:' . $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
            <?php endforeach; ?>
          </optgroup>
          <optgroup label="Single product">
            <?php foreach ($products as $pr): ?>
              <option value="product:<?= (int) $pr['id'] ?>" <?= $target === 'product:' . $pr['id'] ? 'selected' : '' ?>><?= e($pr['name']) ?></option>
            <?php endforeach; ?>
          </optgroup>
        </select>
      </label>
    </div>
    <p class="small muted">Use 0% for an announcement without a discount (e.g. “Free delivery in Hubballi today”).</p>
  </div>
  <div class="col">
    <div class="presets">
      <span class="small muted">Quick:</span>
      <button type="button" class="btn small ghost" data-preset="today">Today only</button>
      <button type="button" class="btn small ghost" data-preset="weekend">This weekend</button>
      <button type="button" class="btn small ghost" data-preset="week">7 days</button>
    </div>
    <div class="two">
      <label>Starts <input type="datetime-local" name="starts_at" value="<?= e(dt_local($o['starts_at'])) ?>" required></label>
      <label>Ends <input type="datetime-local" name="ends_at" value="<?= e(dt_local($o['ends_at'])) ?>" required></label>
    </div>
    <label>Banner photo (optional) <input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label>
    <?php if (!empty($o['image'])): ?><img class="offer-img" src="/<?= e($o['image']) ?>" alt=""><?php endif; ?>
    <label class="check"><input type="checkbox" name="is_active" value="1" <?= $o['is_active'] ? 'checked' : '' ?>> Active</label>
  </div>
  <div class="form-actions">
    <button class="btn" type="submit"><?= $editing ? 'Save offer' : 'Publish offer' ?></button>
    <?php if ($editing): ?><a class="btn ghost" href="/admin/offers.php">Cancel</a><?php endif; ?>
  </div>
</form>
<?php admin_footer();
