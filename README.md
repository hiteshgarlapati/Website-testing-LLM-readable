# Oakline Furniture

AI-crawlable static furniture catalogue (Astro). Built for LLM / search-agent readability testing.

## Stack

- **Astro 7** static site (`frontend/`)
- Machine feeds: `/llms.txt`, `/products.json`, `/robots.txt`, `/sitemap.xml`
- Schema.org JSON-LD on every page
- Production image: **Node 22 build** → **Nginx** (`Dockerfile`)

## Prerequisites

- Node.js **22+**
- Docker (optional, for container deploy)

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:4321

## Production build (static files)

Set your public domain first (required for absolute image/JSON-LD URLs):

```bash
# repo root
cp .env.example .env
# edit SITE_URL=https://your-real-domain.com

cd frontend
cp .env.example .env   # or symlink / reuse the same SITE_URL
# edit SITE_URL to match

npm ci
npm run build
```

Upload everything in `frontend/dist/` to your host (`public_html` on GoDaddy). See [GODADDY.md](./GODADDY.md).

## Production with Docker

```bash
cp .env.example .env
# set SITE_URL=https://your-real-domain.com

docker compose up -d --build
# site: http://localhost:8080
```

Or:

```bash
docker build --build-arg SITE_URL=https://your-real-domain.com -t oakline-furniture:production .
docker run --rm -p 8080:80 oakline-furniture:production
```

`SITE_URL` is a **build arg** — it is compiled into the static files. Changing it later requires a rebuild.

## AI readability surfaces

| Path | Purpose |
|------|---------|
| `/llms.txt` | Plain-text catalogue for LLMs (includes absolute image URLs) |
| `/products.json` | Structured product API (absolute `image` URLs) |
| `/robots.txt` | Allows major AI crawlers |
| `/sitemap.xml` | Page index |
| JSON-LD | `FurnitureStore`, `ItemList`, `Product`, `FAQPage` |

## Catalogue edits

Edit `frontend/src/data/items.json`, replace images under `frontend/public/images/`, then rebuild (and rebuild the Docker image if you use containers).

## License

Copyright © 2026 Oakline Furniture. All rights reserved.
