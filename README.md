# Oakline Furniture

> An industrial-standard, AI-crawlable e-commerce platform built for a small-batch handcrafted furniture studio in Grand Rapids, Michigan.

## Overview

This codebase follows modern engineering practices and is architected to deliver optimal user interfaces alongside seamless automated indexing for artificial intelligence (AI) crawlers and large language models (LLMs).

## Architecture & Directory Layout

The repository is structured as a clean multi-workspace environment:

```
├── design-mockups/   # Archived Omelette UI prototypes and design canvas assets
├── frontend/         # Primary production web application built with Astro
│   ├── public/       # Static assets, robots.txt, llms.txt, and sitemap.xml
│   ├── src/          # Modular component design, schemas, and layouts
│   └── dist/         # Compiled static bundle ready for global CDNs
├── static/           # Standalone vanilla HTML static mirror/backup
└── package.json      # Root orchestration scripts
```

## AI Crawlability & SEO Specifications

This platform implements comprehensive standards to ensure immediate transparency and accurate indexing by AI extraction engines (such as GPTBot, ClaudeBot, PerplexityBot, and Google-Extended):
- **`llms.txt`**: Located in `/public/llms.txt`, providing structured Markdown contextual data specifically formatted for language models and generative search engines.
- **JSON-LD Structured Schema**: All pages incorporate rich Schema.org definitions (`@type: FurnitureStore`, `ItemList`, and `Product`), embedding explicit pricing, stock availability, and physical dimensional metadata.
- **Semantic HTML & Clean Identifiers**: All interactive and structural elements carry descriptive attributes and deterministic IDs.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3+ (optional, for standalone zero-dependency static serving)

### Quick Commands (From Repository Root)

| Command | Description |
|---|---|
| `npm run dev` | Launches the Astro local development server (`http://localhost:4321`) |
| `npm run build` | Compiles the optimized production deployment bundle in `frontend/dist` |
| `npm run preview` | Previews the production bundle using Astro preview |
| `npm run serve-dist` | Starts a persistent lightweight local HTTP server on port 8080 hosting `frontend/dist` |
| `npm run serve-static` | Serves the standalone vanilla HTML backup version on port 8080 |

## Production Deployment

The project builds to a fully static output bundle (`frontend/dist`), making it compatible with any static site hosting provider, edge CDN, or object storage bucket (Vercel, Netlify, Cloudflare Pages, AWS S3 / CloudFront, or GitHub Pages). Simply configure your CI/CD workflow to execute `npm run build`.

## License

Copyright © 2026 Oakline Furniture. All rights reserved.
