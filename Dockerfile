# Stage 1: Build the static Astro site (Node 22)
FROM node:22-alpine AS build

WORKDIR /app

# Baked into HTML, JSON-LD, sitemap, llms.txt, and absolute image URLs
ARG SITE_URL=https://oaklinefurniture.example
ENV SITE_URL=$SITE_URL
ENV NODE_ENV=production

# Copy dependency manifests first for better layer caching
COPY package.json ./
COPY frontend/package.json frontend/
COPY frontend/package-lock.json frontend/

WORKDIR /app/frontend
RUN npm ci --omit=dev

# Copy application source and build
WORKDIR /app
COPY frontend ./frontend

WORKDIR /app/frontend
RUN npm run build

# Stage 2: Serve the static bundle with Nginx
FROM nginx:1.27-alpine AS production

LABEL org.opencontainers.image.title="Oakline Furniture"
LABEL org.opencontainers.image.description="AI-readable static furniture catalogue"
LABEL org.opencontainers.image.source="https://github.com/hiteshgarlapati/Website-testing-LLM-readable"

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Confirm critical AI-facing files exist in the image
RUN test -f /usr/share/nginx/html/index.html \
 && test -f /usr/share/nginx/html/products.json \
 && test -f /usr/share/nginx/html/llms.txt \
 && test -f /usr/share/nginx/html/robots.txt \
 && test -f /usr/share/nginx/html/sitemap.xml

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
