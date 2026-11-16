# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the API.
#
# Stage 1 installs dependencies and compiles TypeScript, keeping the build
# toolchain out of the final image. Stage 2 ships only the compiled output and
# production dependencies.
#
# Why node:22-alpine: alpine keeps the base tiny, and Node 22 is the current LTS.
#
# better-sqlite3 is a native module whose prebuilt binaries target glibc, not
# musl, so on alpine it compiles from source. The toolchain below therefore
# exists only in the build stage; the runtime stage stays a bare alpine + node.

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

# node-gyp needs a C/C++ toolchain and Python on musl. Installed in this stage
# only, so none of it ships in the final image.
RUN apk add --no-cache python3 make g++

# Copy manifests first so Docker can cache the expensive install layer and only
# re-run it when dependencies actually change.
COPY package.json package-lock.json ./
# dev dependencies are needed: typescript compiles the sources.
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies from the tree that the runtime stage will copy. This is
# what keeps the final image small without a second install.
RUN npm prune --omit=dev

# better-sqlite3 is compiled from source here, so its tree still holds the C++
# sources, headers and prebuild machinery (about 27MB) that nothing needs at run
# time. Only the compiled binding and the JS wrapper are kept.
RUN cd node_modules/better-sqlite3 \
    && rm -rf deps src build docs test benchmarks binding.gyp \
    && find . -name '*.md' -delete \
    && find . -name '*.o' -delete


# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app

# Only production dependencies, compiled JS and the package manifest.
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# SQLite files live here. Declared as a volume so the database survives a
# container restart; without it every restart would look like a fresh install.
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/tickets.db \
    CORS_ORIGIN=http://localhost:8080

# Run unprivileged. The directory is created first so the `node` user can write
# the SQLite file and its WAL sidecars.
RUN chown -R node:node /app/data
USER node

EXPOSE 3000

# The API answers on /api/tickets; use that rather than a health-only endpoint.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/tickets').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
