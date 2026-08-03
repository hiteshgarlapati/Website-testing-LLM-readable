# GoDaddy (static hosting) deploy guide
#
# This site builds to plain HTML/CSS/JS in frontend/dist/.
# That folder is what you upload to GoDaddy.

## 1. Set your real domain (important for AI crawlers)

In `frontend/`, create a `.env` file:

```
SITE_URL=https://YOUR-DOMAIN.com
```

JSON-LD, sitemap.xml, robots.txt, llms.txt, and **product image URLs in products.json**
all use this URL. After setting it, rebuild so absolute picture links point at your live host
(e.g. `https://YOUR-DOMAIN.com/images/p4.png`) — that is what lets multimodal LLMs fetch photos.

If you skip it, they keep the placeholder `https://oaklinefurniture.example`.

## 2. Build

From the repo root:

```bash
cd frontend
npm install
npm run build
```

Output: `frontend/dist/`

## 3. Upload to GoDaddy

1. Log in to GoDaddy → your hosting → File Manager (or use FTP).
2. Open the site’s web root (usually `public_html`).
3. Upload **everything inside** `frontend/dist/` into `public_html`
   (index.html should sit at the root of public_html, not inside a nested folder).
4. Visit `https://YOUR-DOMAIN.com` and check:
   - `/` homepage
   - `/product/harbor-bed-frame`
   - `/products.json`
   - `/llms.txt`
   - `/robots.txt`
   - `/sitemap.xml`

## 4. Docker production (optional)

If the recipient runs containers instead of plain static hosting:

```bash
cp .env.example .env
# set SITE_URL=https://YOUR-DOMAIN.com

docker compose up -d --build
# http://localhost:8080
```

Requires Docker Desktop. Image uses **Node 22** to build, then **Nginx** to serve.

