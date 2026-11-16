# Multi-stage build for the Python API smoke tool.
#
# uv syncs from the lockfile, so the image is reproducible. The final stage is a
# plain python-slim with the tool's virtualenv and no uv binary.
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS build
WORKDIR /app

# Copy only the dependency metadata first: the expensive resolve layer then stays
# cached until the lockfile actually changes.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY smoke.py ./
RUN uv sync --frozen --no-dev


FROM python:3.12-slim-bookworm AS runtime
WORKDIR /app

# A virtualenv is relocatable as long as the interpreter path matches, which it
# does here because both stages use the same Python minor version.
COPY --from=build /app/.venv /app/.venv
COPY --from=build /app/smoke.py ./

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

USER nobody
ENTRYPOINT ["python", "smoke.py"]
