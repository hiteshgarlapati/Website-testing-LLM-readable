# Stage 1: Build Astro (Node 22, monorepo workspaces)
FROM node:22-alpine AS build

WORKDIR /app

ARG SITE_URL=https://oaklinefurniture.example
ENV SITE_URL=$SITE_URL
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

RUN npm ci

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Node server (public catalogue + admin + Excel import)
FROM node:22-alpine AS production

LABEL org.opencontainers.image.title="Oakline Furniture"
LABEL org.opencontainers.image.description="AI-readable furniture catalogue with admin Excel import"
LABEL org.opencontainers.image.source="https://github.com/hiteshgarlapati/Website-testing-LLM-readable"

RUN apk add --no-cache tini wget

WORKDIR /app/frontend

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATA_DIR=/app/data
ENV SEED_DIR=/app/seed

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/frontend/package.json ./package.json
COPY --from=build /app/frontend/dist ./dist
COPY --from=build /app/frontend/src/data/items.json /app/seed/items.json
COPY --from=build /app/frontend/public/images /app/seed/images

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /app/data/images

VOLUME ["/app/data"]

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/ >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/entrypoint.sh"]
CMD ["node", "dist/server/entry.mjs"]

# Stage 3: Static assets only (no SSR pages / no admin). Use target `production` for the full app.
FROM nginx:1.27-alpine AS static

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/frontend/dist/client /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

RUN test -f /usr/share/nginx/html/robots.txt

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
