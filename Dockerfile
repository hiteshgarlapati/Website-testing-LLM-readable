# Stage 1: Build base engine
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency definition files
COPY package.json ./
COPY frontend/package.json frontend/
COPY frontend/package-lock.json* frontend/

# Install dependencies inside the frontend workspace
WORKDIR /app/frontend
RUN npm install

# Copy source application files
WORKDIR /app
COPY frontend ./frontend

# Execute production static build
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Lightweight Nginx Production Server
FROM nginx:alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production bundle from stage 1
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy optimized production Nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
