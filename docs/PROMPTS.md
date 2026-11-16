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



