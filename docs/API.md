# API Reference

Base path `/api`. JSON in, JSON out. No authentication (out of scope by design).

## Error format

Every failure uses one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | INTERNAL",
    "message": "Human readable summary",
    "details": [{ "field": "title", "message": "Title cannot be empty" }]
  }
}
```

| Status | `code` | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid body, query or `:id` |
| 404 | `NOT_FOUND` | Unknown ticket, or unknown route |
| 500 | `INTERNAL` | Anything unexpected. Stack traces are never returned |

`details` is omitted when there is nothing field-specific to report.

## Ticket object

```json
{
  "id": 1,
  "title": "Printer jam on floor 3",
  "description": "The shared printer keeps jamming on duplex jobs.",
  "priority": "High",
  "status": "Open",
  "createdAt": "2024-05-01T09:15:00.000Z",
  "updatedAt": "2024-05-01T09:15:00.000Z"
}
```

- `priority`: `Low` | `Medium` | `High`
- `status`: `Open` | `In Progress` | `Resolved`
- Timestamps are ISO-8601 UTC strings. The UI converts them to local time.

## Endpoints

### `POST /api/tickets` → `201`

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Required, trimmed, non-empty, max 200 |
| `description` | string | Required, trimmed, non-empty, max 5000 |
| `priority` | enum | Required, `Low` / `Medium` / `High` |

Status is **not** accepted: a new ticket is always `Open`. Unknown fields are
rejected with 400.

### `GET /api/tickets` → `200` (plain array)

| Query | Default | Rules |
| --- | --- | --- |
| `status` | – | `Open` / `In Progress` / `Resolved` |
| `q` | – | Case-insensitive substring match on the title |
| `sort` | `newest` | `newest` or `oldest` by creation time |
| `limit` | `50` | 1–100 |
| `offset` | `0` | ≥ 0 |

Filters compose with `AND` and are applied **before** `LIMIT`/`OFFSET`, so pages
are consistent with the filtered result set. `offset` past the end returns `[]`,
not an error.

The response is a plain array, not a `{ data, meta }` envelope, because that is
the contract. The consequence is no total count, so the UI pages with
"Load more" instead of "Page N of M".

### `GET /api/tickets/:id` → `200`

Full ticket. `:id` must be a positive integer, otherwise 400. Unknown id is 404.

### `PATCH /api/tickets/:id` → `200`

Partial update. Accepts any subset of `title`, `description`, `priority`,
`status`; **at least one** is required. Only the provided fields change, and
`updatedAt` is always refreshed. Unknown fields and an empty body are 400.

### `DELETE /api/tickets/:id` → `204`

Hard delete, no body. Deleting an id that is already gone returns 404 rather than
succeeding silently.

## Examples

```bash
# Create
curl -X POST http://localhost:3000/api/tickets \
  -H 'content-type: application/json' \
  -d '{"title":"Printer jam","description":"Floor 3","priority":"High"}'

# Filter, search and page
curl 'http://localhost:3000/api/tickets?status=Open&q=printer&sort=oldest&limit=10&offset=0'

# Move a ticket on
curl -X PATCH http://localhost:3000/api/tickets/1 \
  -H 'content-type: application/json' -d '{"status":"In Progress"}'

# Delete
curl -X DELETE http://localhost:3000/api/tickets/1
```

## Validation rules

Enforced on the server; the UI mirrors them only for fast feedback.

| Rule | Result |
| --- | --- |
| `title` required, non-empty after trim | 400 with `details[].field = "title"` |
| `description` required, non-empty after trim | 400 with `details[].field = "description"` |
| `priority` exactly `Low`, `Medium`, `High` | 400 |
| `status` exactly `Open`, `In Progress`, `Resolved` | 400 |
| `:id` a positive integer | 400 |
| Unknown fields | 400 (rejected, not stripped) |
| Non-object JSON body | 400 |
