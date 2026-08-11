# Deploy Quillovan.com on Cloudflare Pages (free)

This catalogue is built as **static HTML** so it can run on [Cloudflare Pages](https://pages.cloudflare.com/) at no cost. HTTPS is included.

**Live Excel admin does not run on Pages** (no writable disk). Update products on your laptop with `npm run dev` → `/admin`, commit `items.json` + images, push — Pages rebuilds the site.

## 1. Point GoDaddy DNS at Cloudflare

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com/).
2. **Add a site** → enter `quillovan.com` → choose the **Free** plan.
3. Cloudflare shows two nameservers, for example:
   - `ada.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`
4. In [GoDaddy Domain Settings](https://dcc.godaddy.com/) → **quillovan.com** → **DNS** → **Nameservers** → **Change** → **I’ll use my own nameservers**.
5. Paste Cloudflare’s two nameservers → save.

Propagation is often 15–60 minutes (sometimes up to 24 hours). Keep GoDaddy as the place you **bought** the domain; Cloudflare becomes the **DNS + host**.

**Email:** if you use GoDaddy email (or Google Workspace), copy the existing **MX** records into Cloudflare DNS before switching nameservers, or mail will break.

## 2. Connect the GitHub repo to Pages

1. Push this repo to GitHub (already: `Website-testing-LLM-readable`).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select the repo and branch `main`.
4. Build settings:

| Setting | Value |
|---------|--------|
| Framework preset | None (or Astro) |
| Root directory | *(leave empty)* |
| Build command | `npm ci && npm run build` |
| Build output directory | `frontend/dist/client` |
| Node.js version | `22` (Environment variable `NODE_VERSION=22`) |

5. **Environment variables** (Production):

| Name | Value |
|------|--------|
| `SITE_URL` | `https://quillovan.com` |
| `NODE_VERSION` | `22` |

6. Save and deploy. You’ll get a URL like `https://something.pages.dev` — open it and check `/browse`, `/products.json`, `/llms.txt`.

## 3. Attach quillovan.com

1. Pages project → **Custom domains** → **Set up a custom domain**.
2. Add `quillovan.com` and `www.quillovan.com`.
3. Cloudflare will create the DNS records (orange-cloud proxied). Wait until the status is **Active**.
4. Visit [https://quillovan.com](https://quillovan.com).

Optional: in the domain’s SSL/TLS settings use **Full (strict)**. Pages already has a certificate.

## 4. After you change the catalogue

```bash
npm run dev
# open http://localhost:4321/admin  → upload Excel
git add frontend/src/data/items.json frontend/public/images
git commit -m "Update catalogue"
git push
```

Pages rebuilds automatically. Wait 1–2 minutes, then hard-refresh the live site.

## What this does *not* include

| Want | Why not on free Pages |
|------|------------------------|
| Instant Excel upload on the live site | Workers/Pages have no persistent disk |
| Old catalog360 / Docker server | You can ignore it |

Docker + Node (see [README.md](./README.md)) is only if you later want live admin on a VPS.
