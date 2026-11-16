# Mini Support Ticket Tracker — Full-Stack Internship Assessment

Small full-stack web app for managing support tickets: UI -> REST API -> database.
Problem statement: `docs/Full_Stack_Internship_Assessment.pdf` (source of truth).
Time box: **2 hours**. Completeness and clarity beat visual polish.

## Role

You are a senior full-stack engineer. Prefer clean, readable, well-structured code
over clever code. Explain non-obvious decisions in comments — the author will be
asked about every line and every engineering decision. Do NOT implement
authentication (explicitly out of scope).

## Grading weights (optimise for these)

| Area                                     | Weight |
|------------------------------------------|--------|
| Backend structure and API design         | 30%    |
| Frontend implementation and API handling | 30%    |
| End-to-end functionality                 | 25%    |
| Code readability and engineering choices | 10%    |
| README and clarity of assumptions        | 5%     |

## Tech stack (the PDF allows any; this is the chosen one — do not deviate)

| Concern    | Choice                                                         |
|------------|----------------------------------------------------------------|
| Backend    | Node.js 20+ / Express 4 / TypeScript                           |
| Validation | `zod` (one schema per request shape, shared error format)      |
| Database   | SQLite via `better-sqlite3` (file DB, zero setup)              |
| Frontend   | React 18 + Vite + TypeScript, plain `fetch` via a typed API client |
| Styling    | Plain CSS (simple, clean, responsive); no UI framework needed  |
| Tests      | `vitest` + `supertest` (backend); `vitest` for frontend utils  |
| Lint       | ESLint + Prettier, `strict` TypeScript in both packages        |

- No ORM, no auth libraries, no state-management library (React state + hooks).

## Scope and priority

- **P0 — graded core (do first, never put at risk):** create ticket, list
  tickets, ticket details, update status, filter by status, all validation
  rules, REST API, DB, README with run + DB setup + assumptions.
- **P1 — bonus, cheap wins:** loading and error states, search by title, sort
  newest/oldest, delete ticket, basic automated tests (API + validation).
- **P2 — polish:** responsive UI, frontend tests, seed script.

If time runs short, cut from the bottom (P2, then P1). Never cut P0 and never
skip the README. A working flow beats extra features.

## Time budget (2 hours)

| Block      | Work                                                        |
|------------|-------------------------------------------------------------|
| 0:00–0:10  | Scaffold both packages, DB schema, config, README skeleton  |
| 0:10–0:40  | Backend: 4 endpoints + validation + error handling          |
| 0:40–1:20  | Frontend: list + filter, create form, details view, status update |
| 1:20–1:40  | P1 bonus: loading/error states, search, sort, delete        |
| 1:40–1:55  | Tests, manual end-to-end pass, fix bugs                     |
| 1:55–2:00  | README final pass (assumptions, run steps)                  |

## Data model

SQLite table `tickets`:

| Column        | Type    | Rules                                                      |
|---------------|---------|------------------------------------------------------------|
| `id`          | INTEGER | PRIMARY KEY AUTOINCREMENT                                  |
| `title`       | TEXT    | NOT NULL, trimmed, non-empty                               |
| `description` | TEXT    | NOT NULL, trimmed, non-empty                               |
| `priority`    | TEXT    | NOT NULL, CHECK in (`Low`,`Medium`,`High`)                 |
| `status`      | TEXT    | NOT NULL DEFAULT `Open`, CHECK in (`Open`,`In Progress`,`Resolved`) |
| `created_at`  | TEXT    | NOT NULL, ISO-8601 UTC, set on insert                      |
| `updated_at`  | TEXT    | NOT NULL, ISO-8601 UTC, refreshed on every update          |

Schema is created idempotently on startup (`CREATE TABLE IF NOT EXISTS`);
no manual DB step needed. DB file path comes from env/config.

## API contract

Base path `/api`. JSON in, JSON out.

| Method | Path               | Behaviour                                                         | Success |
|--------|--------------------|-------------------------------------------------------------------|---------|
| POST   | `/api/tickets`     | Create. Body: `title`, `description`, `priority`. Status = `Open` | 201 + ticket |
| GET    | `/api/tickets`     | List. Query: `status`, `q` (title search), `sort` (`newest`\|`oldest`, default `newest`) | 200 + array |
| GET    | `/api/tickets/:id` | One ticket with full description                                  | 200 + ticket |
| PATCH  | `/api/tickets/:id` | Partial update; at minimum `status`. Only provided fields change  | 200 + ticket |
| DELETE | `/api/tickets/:id` | (P1) Delete                                                       | 204     |

Errors use one shape everywhere:
`{ "error": { "code": "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL", "message": "...", "details": [...] } }`

- 400 invalid body/query/id, 404 unknown id, 500 unexpected (never leak stack traces).
- Ticket JSON uses `camelCase` (`createdAt`, `updatedAt`); map from DB columns in
  the repository layer only.

## Validation rules (enforced on the server; mirrored in the UI for UX)

- `title`: required, non-empty after trim.
- `description`: required, non-empty after trim.
- `priority`: exactly `Low`, `Medium`, or `High`.
- `status`: exactly `Open`, `In Progress`, or `Resolved`.
- `:id` must be a positive integer.
- Unknown fields are rejected or stripped (pick one, document it in the README).
- The server is the source of truth; client validation is only for fast feedback.

## Code standards

- Strict TypeScript, no `any`. Domain types (`Ticket`, `Priority`, `Status`)
  defined once per package; priority/status values come from a single const list.
- Backend layering — each layer has one job:
  `routes` (HTTP only) -> `service` (business rules) -> `repository` (SQL only).
  Handlers never contain SQL; repositories never touch `req`/`res`.
- Dependency injection by constructor/factory: the repository receives the DB
  handle, the service receives the repository, `createApp(deps)` receives the
  service. No module-level singletons or mutable globals. This is also what
  makes tests use an in-memory DB.
- Use parameterized SQL only (never string-concatenated queries).
- Centralised error-handling middleware; async errors forwarded, not swallowed.
- No magic strings/numbers: port, DB path, CORS origin come from env with
  typed defaults loaded once.
- Frontend: all HTTP lives in `src/api/` (typed client). Components never call
  `fetch` directly. Every data-loading view handles loading, error, and empty states.
- Small functions, meaningful names, comments explain *why*. No dead code,
  no `console.log` left behind (use a tiny logger or remove).

## Project structure

```
README.md
AGENTS.md
docs/                          # Full_Stack_Internship_Assessment.pdf, PROMPTS.md
backend/
  package.json  tsconfig.json  .env.example
  src/
    index.ts                   # composition root: wires db -> repo -> service -> app, listens
    app.ts                     # createApp(deps): middleware + routes + error handler
    config.ts                  # env -> typed config, loaded once
    db/                        # connection + schema init
    tickets/
      ticket.types.ts          # Ticket, Priority, Status, constants
      ticket.schema.ts         # zod schemas (create, patch, list query, id)
      ticket.repository.ts     # SQL only
      ticket.service.ts        # rules, not-found handling
      ticket.routes.ts         # HTTP handlers
    middleware/                # validate, errorHandler, notFound
  tests/                       # supertest against in-memory SQLite
frontend/
  package.json  vite.config.ts  tsconfig.json
  src/
    api/                       # typed client + error mapping
    components/                # TicketList, TicketRow, TicketForm, TicketDetails, StatusSelect, FilterBar, states
    hooks/                     # useTickets, useTicket
    types.ts
    App.tsx  main.tsx  styles.css
```

## UI requirements

- **List view:** table/list showing title, priority, status, created date;
  status filter (All / Open / In Progress / Resolved); click a row for details.
- **Create form:** title, description, priority select (default Medium); inline
  field errors; on success, the new ticket appears without a manual reload.
- **Details view:** full description + all ticket info; status dropdown that
  PATCHes immediately and updates the UI (show saving/error feedback).
- **P1:** search box (debounced) by title, newest/oldest toggle, delete with
  confirm, loading spinner/text, error banner with retry, empty state.
- Keep it simple and usable. Responsive layout is P2.
- Filtering/searching/sorting go through the API query params, not client-only.

## Deliverables checklist

Keep these current as the work progresses; do not leave them for the end.

- **Source code** — backend + frontend, runnable from a clean clone.
- **`README.md`** must contain:
  - Prerequisites (Node version) and exact backend run steps.
  - Exact frontend run steps and the URL; how the frontend finds the API.
  - Database/setup instructions (auto-created SQLite file, where it lives,
    how to reset it, optional seed).
  - API summary (endpoints, query params, error format).
  - **Assumptions** (e.g. no auth, single user, SQLite for simplicity, unknown
    fields policy, timestamps in UTC, delete is hard delete).
  - How to run the tests.
  - Short "engineering decisions / what I'd do next" section.
- `docs/PROMPTS.md` — log key prompts used; append after each major step.

## Testing

Minimum (P1): backend API tests with `supertest` + in-memory SQLite covering
create (valid + each validation failure), list, filter by status, get by id
(found + 404), patch status (valid + invalid), default status = `Open`.
Verify the full UI flow manually before finishing: create -> appears in list ->
open details -> change status -> filter shows it correctly.

### Git workflow (every change, no exceptions)

`main` holds only the base folder structure and default files. Never commit
or push feature work directly to `main`, and never merge a PR yourself —
the author reviews and merges every PR.

1. **Start from fresh main:** `git checkout main && git pull`, then create
   one branch for one feature / function / requirement, named by what it
   does: `feature/ticket-create-api`, `feature/ticket-list-filter-ui`,
   `fix/...`, `docs/...`, `test/...`, `chore/...`.
   Keep each branch small and focused on a single requirement.
2. **Build it, committing as you go.** Every change is committed — never
   leave work uncommitted. Small, logical commits with clear messages in
   imperative mood (`feat: add ticket repository`, `fix: ...`, `docs: ...`,
   `test: ...`).
3. **No co-author or tool attribution in commits or PRs.** Never add
   `Co-Authored-By`, `Generated with Claude Code`, `Claude-Session`, or any
   other trailer/footer. Commit messages contain only the message itself.
   If a hook rejects a commit for this reason, amend the message — do not
   bypass the hook with `--no-verify`.
4. **Complete, verify, test before the PR:** run the tests, run the affected
   part of the app end to end, and confirm the behaviour against the API
   contract and validation rules above. Run `/review` for any non-trivial
   feature. Fix everything found before moving on.
5. **Raise the PR to `main`:** push the branch and open it with
   `gh pr create --base main` (or give the author the compare link). The PR
   description covers what changed, why, how it was tested, and anything the
   reviewer should check. No tool-attribution footer.
6. **Stop and wait.** After raising the PR, tell the author it is ready and
   do not start the next feature until they confirm it is merged. Then
   return to step 1 from an updated `main`.

## Skills

Do not load any skill by default. Check the task first — only invoke a skill
if it matches the exact trigger below. Never invoke a skill just because it
exists.

- `/architect` — before building something non-trivial with no plan yet
- `/review` — when a feature is done and needs a production check
- `/recover` — when something is broken and the fix isn't obvious
- `/remember` — at the start of a new session to restore context,
  and at the end to save progress

## Session continuity

REQUIRED — do not skip, do not wait to be asked:

- **First action of every session:** run `/remember restore` before doing anything else.
- **Last action of every session:** run `/remember save` before closing.
