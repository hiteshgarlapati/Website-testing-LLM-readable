# Deploy / repair — catalog360.4sightai.com

Live symptoms (empty browse, wrong links in `llms.txt`, upload CSRF):

- [`/products.json`](https://catalog360.4sightai.com/products.json) is `[]`
- [`/llms.txt`](https://catalog360.4sightai.com/llms.txt) still shows `https://oaklinefurniture.example/`
- [`/admin`](https://catalog360.4sightai.com/admin) shows **0 products live**

That means the **Node app is running**, but the **catalogue volume has no publishable products** (empty or missing `items.json` / images) and the image was **built with the wrong `SITE_URL`**.

## On the server (SSH into the host that runs Docker)

```bash
cd /path/to/Furniture-store-UI-mockup   # your clone

cat > .env <<'EOF'
NODE_ENV=production
PORT=8004
SITE_URL=https://catalog360.4sightai.com
ADMIN_SECRET=your-same-secret-as-before
EOF

git pull
docker compose build --no-cache
docker compose up -d
```

Wait ~30s, then check:

```bash
docker logs oakline-furniture-app --tail 30
# Expect: "Syncing product images into /app/data/images"
```

Verify in a browser:

| URL | Expected |
|-----|----------|
| https://catalog360.4sightai.com/products.json | JSON array with ~103 products |
| https://catalog360.4sightai.com/images/kodai-three-seater-1.jpg | Product photo (not 404/500) |
| https://catalog360.4sightai.com/llms.txt | Links use `https://catalog360.4sightai.com` |
| https://catalog360.4sightai.com/browse | Filled product cards, not only empty slots |

## Reverse proxy (if Nginx is in front of port 8004)

Use `docker/nginx-reverse-proxy.conf.example` with `server_name catalog360.4sightai.com;` and the `X-Forwarded-Proto` / `X-Forwarded-Host` headers so **Admin uploads** work.

## Still empty after redeploy?

Reset the catalogue volume once (only if you have no uploads to keep):

```bash
docker compose down -v
docker compose up -d --build
```

## Admin uploads

Open https://catalog360.4sightai.com/admin → enter **Admin secret** → upload `.xlsx` per category (photos in **Image1**).
