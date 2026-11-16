# Development

## Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 20+ (22 LTS recommended) | Both packages declare `engines.node >= 20` |
| Docker | optional | Only needed for the containerised stack |
| uv | optional | Only needed for the Python smoke tool |

`better-sqlite3` is a native module. On Windows, Node 20+ has prebuilt binaries
for the published versions; on alpine/musl it compiles, which is why the Docker
build stage installs a toolchain.

## First run

```bash
# API
cd backend
npm install --include=dev
npm run dev            # http://localhost:3000

# UI (second terminal)
cd frontend
npm install --include=dev
npm run dev            # http://localhost:5173
```

> `--include=dev` matters: if `npm config get omit` returns `dev`, a plain
> `npm install` silently skips TypeScript, ESLint and Vitest.

The database file is created automatically on first boot, so no setup step is
required. `npm run seed` in `backend/` adds five sample tickets (it skips if any
exist).

## Scripts

Both packages expose the same four commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Watch mode (API: tsx, UI: Vite) |
| `npm run build` | Type-check and produce `dist/` |
| `npm run typecheck` | Types only, no emit |
| `npm test` | Vitest |
| `npm run lint` | ESLint, zero warnings tolerated |
| `npm run format` | Prettier write |

Backend extras: `npm start` (run the built output) and `npm run seed`.

## Environment

`backend/.env.example` lists everything. Every value has a typed default in
`src/config.ts`, so the API runs with no `.env` at all.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `DATABASE_PATH` | `data/tickets.db` | Relative to `backend/`, or `:memory:` |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin |
| `NODE_ENV` | `development` | Affects logging only |
| `API_PROXY_TARGET` | `http://localhost:3000` | UI only: where Vite proxies `/api` |

## Project layout

```
backend/
  src/            layering, see docs/ARCHITECTURE.md
  tests/          supertest suites against an in-memory database
  scripts/        seed
frontend/
  src/api/        the only fetch calls
  src/hooks/      data loading
  src/components/ views and shared pieces
tools/smoke/      uv-managed end-to-end checks
docs/             this documentation set
```

## Testing

```bash
cd backend && npm test        # 34 API tests, supertest + in-memory SQLite
cd frontend && npm test       # 16 unit tests, error mapping and client wiring
```

The API tests build the app through `createApp(deps)` against a fresh in-memory
database, so they exercise the same wiring production uses.

## Before opening a PR

```bash
# in both packages
npm run typecheck && npm run lint && npm test && npm run build
```

Plus, if the API contract changed, run the smoke tool against a live server:

```bash
cd tools/smoke && uv run python smoke.py
```

## Known sharp edges

- **The UI production build type-checks test files.** `npm run build` runs
  `tsc -b`, which includes everything in `tsconfig.json`. Tests are part of the
  type surface on purpose; they have caught real regressions.
- **`noUncheckedIndexedAccess` is on.** Array indexing yields `T | undefined`.
  This is why test helpers that index into mock calls assert instead of casting.
- **Search wildcards are literal.** `q` is not escaped, so `%` matches nothing
  special; the worst case is a broader match, never an injection, because the
  value is always bound as a parameter.
