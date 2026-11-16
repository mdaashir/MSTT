# Architecture

A three-tier application that stays deliberately small. Each layer has one job and
talks only to its neighbour.

```
Browser (React)  ──HTTP/JSON──▶  Express API  ──SQL──▶  SQLite file
   /src/api            /api/tickets          better-sqlite3
```

In Docker the browser talks to nginx, and nginx proxies `/api` to the API
container. The same relative base path works in development because Vite proxies
`/api` too.

## Backend layering

```
src/index.ts          composition root: config -> db -> repository -> service -> app, listen
src/app.ts            createApp(deps): middleware, routes, error handler
src/config.ts         env parsed once through zod, typed defaults
src/db/index.ts       connection + idempotent schema
src/tickets/
  ticket.types.ts     Ticket, Priority, Status, the const lists they come from
  ticket.schema.ts    zod schemas, one per request shape, all strict
  ticket.repository.ts  SQL only; the only place column names and camelCase meet
  ticket.service.ts   rules and not-found decisions
  ticket.routes.ts    HTTP only: parse, call one service method, pick a status
src/middleware/       validation helper and the single error funnel
```

Rules that keep it honest:

- Handlers never contain SQL. Repositories never touch `req`/`res`.
- Dependencies are injected: the repository receives the database handle, the
  service receives the repository, `createApp(deps)` receives the service. There
  are no module-level singletons, which is exactly what lets the tests build the
  app against an in-memory database.
- Unknown fields are rejected, not stripped (`.strict()`), so a client typo is a
  400 rather than a success that did nothing.
- One error shape everywhere: `{ error: { code, message, details? } }` with
  `VALIDATION_ERROR` / `NOT_FOUND` / `INTERNAL`. Unexpected errors are logged
  server-side and reported as a generic 500.

## Frontend data path

```
src/api/tickets.ts    the only module that calls fetch
src/api/errors.ts     every failure becomes one typed ApiClientError
src/hooks/            useTickets (list), useTicket (one), useDebouncedValue
src/components/       views and small shared pieces
src/App.tsx           owns filter, sort, search, selection and the refresh token
```

Rules that keep it honest:

- Components never call `fetch`; they use hooks, which use the client.
- Filter, search, sort and pagination are API query params. The browser never
  filters a full list client-side, so the server stays the source of truth and
  pages match the filtered result set.
- Every data view handles loading, error, empty and populated states.

## Why these choices

| Choice | Reason |
| --- | --- |
| `better-sqlite3` | Synchronous API removes a whole class of concurrency bugs for an app this size; a single file needs no service. |
| Zod | One schema per request shape, and the same parse produces the error `details` the UI renders under the right field. |
| Constructor injection | Makes the in-memory test database possible without a single test-only branch in application code. |
| Plain array list response | Fixed by the contract in `AGENTS.md`; pagination is therefore expressed with `limit`/`offset`. |
| Relative `/api` base path | No host in the source; Vite proxy in development, nginx proxy in Docker. |
| nginx for the UI | The final image has no Node runtime, so there is nothing to exploit beyond static file serving. |
