# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the UI.
#
# Stage 1 installs dependencies and runs the Vite production build. Stage 2 is a
# bare nginx image serving static files: no Node, no dev toolchain, nothing to
# exploit at runtime beyond nginx itself.

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY tsconfig.json vite.config.ts seo.ts index.html ./
COPY src ./src
# Static files: favicon.svg and og-image.svg are referenced by index.html, so they
# must be present before the build runs, not copied afterwards.
COPY public ./public

# The origin that canonical, Open Graph and sitemap URLs are built from. Absolute
# URLs are mandatory there, so this has to be the real deployment origin; the
# default keeps an unnoticed build pointing at localhost rather than a wrong host.
ARG VITE_SITE_URL=http://localhost:8080
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN npm run build


# ---------- Stage 2: serve ----------
FROM nginx:1.27-alpine AS runtime

# Our config, not the default one: it enables compression, cache headers and the
# single-page-app fallback.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Only the built assets cross the stage boundary.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider --quiet http://127.0.0.1/ || exit 1
