"""End-to-end smoke check for the ticket API.

This exists because the three layers can each be individually correct and still
disagree: the UI can send a field the schema rejects, or the schema can accept a
body the database refuses. This script drives the real HTTP API through the full
ticket lifecycle and asserts the contract from AGENTS.md.

Run it against a live API:

    uv run python smoke.py                      # http://localhost:3000
    API_BASE_URL=http://localhost:8080 uv run python smoke.py

Exit code is 0 when every check passes, 1 otherwise, so it is usable in CI.
"""

from __future__ import annotations

import os
import sys

import httpx

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000").rstrip("/")

failures: list[str] = []


def check(condition: bool, label: str) -> None:
    """Record one assertion instead of throwing, so a run reports every problem."""
    if condition:
        print(f"  ok   {label}")
    else:
        print(f"  FAIL {label}")
        failures.append(label)


def main() -> int:
    print(f"Smoke checking {BASE_URL}")

    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # Create: status must default to Open, timestamps must be present.
        created = client.post(
            "/api/tickets",
            json={
                "title": "Smoke test ticket",
                "description": "Created by tools/smoke/smoke.py",
                "priority": "High",
            },
        )
        check(created.status_code == 201, "create returns 201")
        ticket = created.json() if created.status_code == 201 else {}
        check(ticket.get("status") == "Open", "create defaults status to Open")
        check(bool(ticket.get("createdAt")), "create returns createdAt")
        check("created_at" not in ticket, "API is camelCase")

        ticket_id = ticket.get("id")

        # Validation failures must all use the same shape.
        for body, label in [
            ({"title": "", "description": "x", "priority": "Low"}, "empty title rejected"),
            ({"title": "x", "description": "  ", "priority": "Low"}, "blank description rejected"),
            ({"title": "x", "description": "y", "priority": "Urgent"}, "bad priority rejected"),
            ({"title": "x", "description": "y", "priority": "Low", "status": "Open"}, "status not accepted on create"),
        ]:
            response = client.post("/api/tickets", json=body)
            code = response.json().get("error", {}).get("code")
            check(response.status_code == 400 and code == "VALIDATION_ERROR", label)

        if ticket_id is not None:
            # Read one back, and confirm an unknown id is a 404.
            one = client.get(f"/api/tickets/{ticket_id}")
            check(one.status_code == 200, "get by id returns 200")
            check(one.json().get("id") == ticket_id, "get returns the same ticket")

            missing = client.get("/api/tickets/999999")
            check(
                missing.status_code == 404 and missing.json().get("error", {}).get("code") == "NOT_FOUND",
                "unknown id returns 404 NOT_FOUND",
            )

            # Patch only the status; the title must survive.
            patched = client.patch(f"/api/tickets/{ticket_id}", json={"status": "Resolved"})
            check(patched.status_code == 200, "patch returns 200")
            check(patched.json().get("status") == "Resolved", "patch applies the status")
            check(patched.json().get("title") == "Smoke test ticket", "patch leaves other fields alone")

            # The list is a plain array and honours the status filter.
            listed = client.get("/api/tickets", params={"status": "Resolved"})
            body = listed.json()
            check(listed.status_code == 200 and isinstance(body, list), "list returns a plain array")
            check(any(row.get("id") == ticket_id for row in body), "filter finds the resolved ticket")

            # Pagination must not overlap.
            page_one = client.get("/api/tickets", params={"limit": 1, "offset": 0}).json()
            page_two = client.get("/api/tickets", params={"limit": 1, "offset": 1}).json()
            ids = [row.get("id") for row in page_one + page_two]
            check(len(ids) == len(set(ids)), "paginated pages do not overlap")

            bad_limit = client.get("/api/tickets", params={"limit": 0})
            check(bad_limit.status_code == 400, "limit=0 rejected")

            # Delete is a hard delete and is not idempotent.
            deleted = client.delete(f"/api/tickets/{ticket_id}")
            check(deleted.status_code == 204, "delete returns 204")
            again = client.delete(f"/api/tickets/{ticket_id}")
            check(again.status_code == 404, "second delete returns 404")

    if failures:
        print(f"\n{len(failures)} check(s) failed")
        return 1

    print("\nAll checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
