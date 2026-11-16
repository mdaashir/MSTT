# Prompts

A log of the key prompts used while building this project, appended after each
major step, so a reviewer can see how the work was directed.

## 0 — Planning

> Architect the Mini Support Ticket Tracker from `docs/Full_Stack_Internship_Assessment.pdf`
> and `AGENTS.md`. Align on terminology, surface the decisions that change the build,
> and produce an implementation plan before any code is written.

Follow-up decisions from the plan review:

> Add pagination.

> Completely dockerize it, make sure it is multi-staged with optimized minimal size
> images. Make sure comments are clear and self-explanatory. Include complete
> documentation (docs). Use npm for Node and uv for Python.

## 1 — Backend data layer

> Build the SQLite connection, the idempotent schema and the ticket domain types.
> Priority/status values must come from one const list, and the config must be
> parsed once from env with typed defaults.

## 2 — Create ticket API

> Add POST /api/tickets with zod validation, the routes -> service -> repository
> split, one error shape everywhere, and createApp(deps) so tests can inject an
> in-memory database.

## 3 — List, filter, search, sort and pagination

> Add GET /api/tickets with status filter, case-insensitive title search, newest/
> oldest sort and limit/offset pagination. It must keep returning a plain array.

## 4 — Get one ticket

> Add GET /api/tickets/:id. Validate the id as a positive integer, return 404 with
> the shared error shape for an unknown id, and keep the not-found decision in the
> service layer.

## 5 — Update a ticket

> Add PATCH /api/tickets/:id. Only the fields present in the body change, at least
> one field is required, updated_at is refreshed, and an unknown id is a 404.

## 6 — Delete a ticket

> Add DELETE /api/tickets/:id returning 204 with no body. Hard delete, 404 for an
> unknown id.

## 7 — Backend tests

> Add vitest + supertest tests against in-memory SQLite covering create and every
> validation failure, list/filter/search/sort/pagination, get found and 404, patch
> valid and invalid, delete, and the default status.

## 8 — Ticket list UI

> Build the typed API client, the hooks and the list view: filter chips, sort
> toggle, loading/error/empty states, click a row to open details, and pagination
> through the API rather than the client.

## 9 — Create ticket UI

> Add the create form with inline field errors that mirror the server rules, map a
> server 400 back onto the matching fields, and make the new ticket appear without
> a manual reload.

## 10 — Ticket details and status update UI

> Add the details view with the full description and all ticket info, plus a status
> dropdown that PATCHes immediately with saving and error feedback, and updates the
> list when the status changes.

## 11 — Search, sort and delete UI

> Add a debounced title search, keep the newest/oldest toggle, and add delete with a
> confirmation step. All three go through API params, not client-side filtering.

## 12 — Frontend tests and responsive CSS

> Add frontend tests for the error mapping, the API client's query building and the
> formatting helpers, and finish the responsive layout for narrow screens.

## 13 — Docker, smoke tool, seed and documentation

> Dockerize the whole stack with multi-stage builds and minimal images, add a
> uv-managed Python smoke tool and a seed script, and write the full documentation
> set (architecture, API, Docker, development, README).

## 14 — Verify the merged main and add CI

> All PRs are merged (and the Dependabot bump reverted). Verify the merged state
> actually installs, typechecks, lints, tests and builds, then add a GitHub
> Actions workflow that runs the same checks.

## 15 — SEO

> Do SEO for this repo — both the web app's metadata and the GitHub repo's
> discoverability (description, topics, README keywords).















