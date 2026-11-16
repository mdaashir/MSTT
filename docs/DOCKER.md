# Docker and deployment

The whole stack is containerised: one image for the API, one for the UI. Both are
multi-stage, so none of the build toolchain ships at runtime.

```
docker compose up --build     # UI on http://localhost:8080, API on :3000
```

## Images

| Image | Base | Size | What runs |
| --- | --- | --- | --- |
| `ticket-tracker-api` | `node:22-alpine` | ~195 MB | Compiled JS + production `node_modules` |
| `ticket-tracker-web` | `nginx:1.27-alpine` | ~48 MB | Static files only, no Node |
| `ticket-smoke` | `python:3.12-slim` | ~126 MB | The uv-managed smoke tool (not part of the stack) |

Both run unprivileged and declare a `HEALTHCHECK`, which compose uses to gate
the UI start until the API actually answers.

### Why multi-stage

| Stage | Contains | Ships? |
| --- | --- | --- |
| `build` (API) | C/C++ toolchain, Python, TypeScript, dev dependencies | no |
| `build` (UI) | Vite, TypeScript, dev dependencies | no |
| `runtime` (API) | `dist/` and pruned production dependencies | yes |
| `runtime` (UI) | `dist/` in nginx | yes |

Notes that are easy to get wrong:

- **`better-sqlite3` is native.** Its prebuilt binaries target glibc, so on musl
  (alpine) it compiles from source. The compiler exists only in the build stage.
  After compiling, the C++ sources and prebuild machinery are deleted — about
  27 MB that does nothing at runtime.
- **`npm ci --include=dev` in the build stage.** TypeScript is a dev dependency,
  and `npm prune --omit=dev` afterwards strips it from the tree that gets copied.
- **`--include=dev` is not redundant.** Some environments set `omit=dev`
  globally, and without the flag the build tools simply would not install.
- **The UI has no Node at runtime.** A static-file server has a far smaller
  attack surface than a Node process.

## How the browser reaches the API

One origin, always:

```
browser ──▶ nginx :8080 ──/api/──▶ api :3000
```

`src/api/tickets.ts` uses the relative path `/api`, so:

- **development** — Vite proxies `/api` to `localhost:3000`
- **docker** — nginx proxies `/api/` to `api:3000` over the compose network
- **behind any reverse proxy** — the same relative path keeps working

CORS is therefore only relevant for the direct `:3000` port in development.

## Database persistence

The API writes SQLite to `/app/data/tickets.db`, backed by the `ticket-data`
named volume. `docker compose down` keeps the volume; `docker compose down -v`
deletes it.

To reset from scratch:

```bash
docker compose down
docker volume rm mstt_ticket-data
docker compose up --build
```

## The Python smoke tool

`tools/smoke` is a uv-managed script that drives the running API through the full
ticket lifecycle and asserts the contract. It is a fourth image, not part of the
web/API stack, and is meant to be run against a live deployment:

```bash
# against compose
cd tools/smoke
API_BASE_URL=http://localhost:8080 uv run python smoke.py

# or as a container on the compose network
docker build -t ticket-smoke ./tools/smoke
docker run --rm --network mstt_default -e API_BASE_URL=http://api:3000 ticket-smoke
```

It exits non-zero if any check fails, so it is usable as a deployment gate.
