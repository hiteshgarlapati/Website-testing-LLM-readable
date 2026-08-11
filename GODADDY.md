# GoDaddy (static hosting) deploy guide

GoDaddy shared hosting serves **static files only**. The **live Excel admin** (`/admin`) needs the **Docker / Node** production setup in [README.md](./README.md).

## Option A — Static site (no live admin)

### 1. Set your real domain

In `frontend/.env`:

```
SITE_URL=https://YOUR-DOMAIN.com
```

### 2. Update the catalogue locally

- Edit `frontend/src/data/items.json`, **or**
- Run `npm run dev`, use `/admin` on your machine, then commit the updated `items.json` and `frontend/public/images/`.

### 3. Build

```bash
cd frontend
npm ci
npm run build
```

For static hosts, prerendered assets live under `frontend/dist/client/` (and server bundle under `dist/server/` — not needed on GoDaddy).

Upload the **contents of `dist/client/`** to `public_html` (plus any product images under `images/`).

### 4. Verify

- `/`, `/browse`, `/product/…`
- `/products.json`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`

## Option B — Full production (admin + uploads)

Use a VPS or any host that runs Docker:

```bash
cp .env.example .env
# SITE_URL=https://YOUR-DOMAIN.com
# ADMIN_SECRET=long-random-secret

docker compose up -d --build
```

Point your domain at the container port (reverse proxy with TLS recommended). See `docker/nginx-reverse-proxy.conf.example`.

Catalogue data is stored in the `catalogue_data` Docker volume (`items.json` + images). On each container start, bundled seed images are merged into the volume and an empty `items.json` is restored from the image build.

## Notes

- `SITE_URL` is baked in at **build** time for JSON-LD and absolute URLs. Change domain → rebuild (static) or rebuild Docker image (production).
- Product images must exist on disk for items to appear on the public site (no placeholder listings).
