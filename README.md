# Quillovan Furniture

AI-crawlable furniture catalogue (Astro) with **Excel admin import**. Built for LLM / search-agent readability testing.

## Stack

- **Astro 7** + **Node adapter** (SSR catalogue + admin API)
- Machine feeds: `/llms.txt`, `/products.json`, `/robots.txt`, `/sitemap.xml`
- Schema.org JSON-LD on every page
- **Production (recommended):** Docker → Node 22 + persistent catalogue volume
- **Static-only (optional):** build and upload HTML — no live admin (see [GODADDY.md](./GODADDY.md))

## Prerequisites

- Node.js **22+**
- Docker (recommended for production with admin)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:4321 — **Admin** is in the header (`/admin`).

Optional `frontend/.env`:

```bash
SITE_URL=http://localhost:4321
# ADMIN_SECRET=dev-secret   # required in production; optional locally
```

## Production with Docker (recommended)

Catalogue data and uploaded images persist in a Docker volume. Admin uploads apply **immediately** (no rebuild).

```bash
cp .env.example .env
# SITE_URL=https://www.yourdomain.com
# ADMIN_SECRET=use-a-long-random-string

docker compose up -d --build
```

Site: **http://localhost:8004** (or your `PORT`).

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | Build-time public URL (JSON-LD, sitemap, absolute image links) |
| `ADMIN_SECRET` | **Required in production** — password for Excel uploads on `/admin` |
| `PORT` | Host port mapped to container `4321` |
| `DATA_DIR` | Inside container: `/app/data` (volume `catalogue_data`) |

### Bare-metal Node (no Docker)

```bash
cp .env.example .env
export DATA_DIR=/var/lib/quillovan/data   # mkdir -p $DATA_DIR/images
mkdir -p frontend && cd frontend
npm ci && npm run build
SITE_URL=... ADMIN_SECRET=... DATA_DIR=... npm run start
```

Listen on `HOST` / `PORT` (default `0.0.0.0:4321`).

## Admin / Excel import

1. Open `/admin`, enter `ADMIN_SECRET` if configured.
2. Upload `.xlsx` per category (template: `/templates/catalogue-template.xlsx`).
3. Each row needs **Name**, **Price**, and a photo in **Image1** (Insert → Pictures → Place in Cell).
4. Bad rows are skipped; failed uploads do **not** wipe the category.

## Static export (GoDaddy, no admin)

See [GODADDY.md](./GODADDY.md). Import Excel locally, then `npm run build` and upload assets.

## AI readability surfaces

| Path | Purpose |
|------|---------|
| `/llms.txt` | Plain-text catalogue for LLMs |
| `/products.json` | Structured product JSON |
| `/robots.txt` | Crawler rules (admin disallowed) |
| `/sitemap.xml` | Page index |
| JSON-LD | `FurnitureStore`, `ItemList`, `Product`, `FAQPage` |

## License

Copyright © 2026 Quillovan Furniture. All rights reserved.
