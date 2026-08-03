# GoDaddy (static hosting) deploy guide
#
# This site builds to plain HTML/CSS/JS in frontend/dist/.
# That folder is what you upload to GoDaddy.

## 1. Set your real domain (important for AI crawlers)

In `frontend/`, create a `.env` file:

```
SITE_URL=https://YOUR-DOMAIN.com
```

JSON-LD, sitemap.xml, robots.txt, and llms.txt all use this URL.
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

## Notes

- This is a **static** site — no Node server, no MongoDB, no admin page.
- To change catalogue text/prices later, edit `frontend/src/data/items.json`, rebuild, and re-upload.
- To change images, replace files under `frontend/public/images/`, rebuild, re-upload.
