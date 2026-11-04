# City Florist · Hubballi

Website and shop-owner dashboard for City Florist: flower bouquets, chocolate bouquets, wedding car decoration, wedding-night room decoration and bridal garlands.

| Folder | What it is | Tech |
| --- | --- | --- |
| `frontend-user/` | Public website: 3D hero, scroll animations, shop, product pages, Buy → WhatsApp | React 19, Vite, Three.js (React Three Fiber), GSAP + ScrollTrigger, Lenis |
| `frontend-dashboard/` | Owner dashboard at `/admin`: products, photos, prices, daily offers, orders, settings | PHP pages (mobile friendly) |
| `backend/` | JSON API (`/api`), shared PHP core, database schema, seed photos, config | PHP 8 + MySQL (SQLite locally) |

## How ordering works

1. The customer taps **Buy** on any product.
2. A form asks for their name and mobile number, plus an optional date and message.
3. `POST /api/orders.php` saves the order. The server takes the price from the database, so it can't be changed in the browser.
4. The customer is sent to `wa.me/<owner number>` with the full order already typed: product, price, name, phone, photo and link. They press **Send**.
5. The order also appears in **Admin → Orders**, so the owner can follow up even if the customer never pressed Send.

## Local development

You need PHP 8.1+ (with `pdo_sqlite` and `gd`) and Node 20+.

```bash
# 1. Backend config (SQLite by default)
cp backend/config.sample.php backend/config.php

# 2. Start PHP (serves /api, /admin, /uploads) — from the repo root
php -S 127.0.0.1:8000 backend/dev-router.php

# 3. Open http://127.0.0.1:8000/admin/install.php once → Install (imports the 80 starter photos)

# 4. Start the website
cd frontend-user
npm install
npm run dev        # → http://localhost:5173 (proxies /api, /admin, /uploads to PHP)
```

Default admin login: `admin` / `ChangeMe@123` (from `config.php`). Change it in **Settings** after the first login.

## Hosting on Hostinger (auto-deploy from GitHub)

This works on any Hostinger web hosting plan (Premium, Business or Cloud). Every push to `main` builds the site and uploads it over FTP with GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

### One-time setup

1. **Create the database.** In hPanel, go to **Databases → MySQL Databases** and create a database and user. Note the database name, username and password (they look like `u123456789_florist`).
2. **Get the FTP details.** In hPanel, go to **Files → FTP Accounts** and note the FTP host (an IP address or `ftp.yourdomain.com`), username and password.
3. **Add GitHub secrets.** In the repository, go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `FTP_SERVER`: the FTP host
   - `FTP_USERNAME`: the FTP username
   - `FTP_PASSWORD`: the FTP password
   - `FTP_SERVER_DIR` (optional): the folder to deploy into. The default is `public_html/`. If your FTP account already opens inside `public_html`, set this to `./`.
4. **Push to `main`.** The first deploy uploads everything. Watch it under the repository's **Actions** tab.
5. **Create `config.php` on the server.** In hPanel **File Manager**, open `public_html`, copy `config.sample.php` to `config.php`, and edit it:
   - `'driver' => 'mysql'`, then the database name, user and password from step 1
   - `'site_url' => 'https://yourdomain.com'`
   - `'debug' => false`
   - the admin username and a strong first password
6. **Install.** Visit `https://yourdomain.com/admin/install.php` and press **Install**. This creates the tables, the admin login and the starter products. The installer locks itself afterwards.
7. **Log in and set the owner's WhatsApp number.** Log in at `https://yourdomain.com/admin/`, go to **Settings**, and set the WhatsApp number, phone, address, hours and Google Maps link.

From then on, every `git push` to `main` updates the live site automatically. Product photos, orders and `config.php` on the server are never overwritten.

### Hostinger notes
- Enable SSL for the domain (hPanel → Security → SSL). The `.htaccess` forces HTTPS.
- Use PHP 8.1 or newer (hPanel → Advanced → PHP Configuration). `gd` and `pdo_mysql` are enabled by default.

## Hosting the website on Vercel (no PHP)
Vercel only hosts the React site; it can't run the API or the dashboard. The project's Root Directory can be the repo root ([vercel.json](vercel.json)) or `frontend-user` ([frontend-user/vercel.json](frontend-user/vercel.json)); both are configured the same way. The site carries a snapshot of the catalogue (data in `frontend-user/src/catalog/`, photos in `frontend-user/public/catalog/`). Vercel builds with `VITE_STATIC_CATALOG=1`, so it uses the snapshot without calling `/api`. Elsewhere the snapshot is only used when `/api` can't be reached. Buy then opens WhatsApp with the order details, but orders aren't saved to Admin → Orders.

The snapshot doesn't update by itself. After changing products, prices or settings locally, run this, then commit and push:

```bash
php backend/scripts/export-static.php
```

## Owner's daily tasks
- **Add a product:** Admin → Products → **+ Add product**. Add a name, category, price and photos (you can pick several straight from the phone).
- **Price the starter products quickly:** Admin → Products → tick **Only without price**, type the prices in the list, then **Save all changes**. Products at ₹0 show “Ask for price”.
- **Today’s discount:** Admin → Daily Offers. Choose a %, what it applies to (everything / a category / one product) and **Today only**. Prices drop automatically and the offer appears in the gold banner with a countdown. It switches off by itself when it ends.
- **Orders:** Admin → Orders. Tap **WhatsApp** to reply, change the status, or download a CSV.

## Regenerating the starter photos
If the original photos in `images/` change, run `php -d memory_limit=512M backend/scripts/build-seed.php` to rebuild `backend/database/seed/` (WebP + manifest).
