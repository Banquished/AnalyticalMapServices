---
phase: 01-backend-correctness
plan: 02
subsystem: api
tags: [fastapi, arcgis, error-handling, python]

# Dependency graph
requires: []
provides:
  - ArcGIS REST clients raise ApiError on API-level errors (naturvern, grunnforurensning, kulturminner)
  - API-level errors are distinguishable from genuine empty results
  - feature_info.py service degrades gracefully via asyncio.gather return_exceptions=True
affects:
  - 01-backend-correctness
  - services/feature_info

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ArcGIS REST error handling: raise ApiError('arcgis_error', ...) with status=err.get('code') when 'error' in data"
    - "Network failure path (data is None) stays as return [] — only API-level errors raise"

key-files:
  created: []
  modified:
    - backend/src/app/clients/naturvern.py
    - backend/src/app/clients/grunnforurensning.py
    - backend/src/app/clients/kulturminner.py

key-decisions:
  - "Raise ApiError instead of silent return [] when ArcGIS returns error payload — errors must be distinguishable from empty results"
  - "Remove unused logging imports after removing logger.warning call — keep imports clean"
  - "data is None path (network failure) unchanged — still returns [] as it is already handled by fetch_json"

patterns-established:
  - "ArcGIS client error pattern: if 'error' in data: err = data.get('error', {}); raise ApiError('arcgis_error', f'ArcGIS error from {_BASE_URL}: {err}', status=err.get('code') if isinstance(err, dict) else None)"

requirements-completed: [ERR-01]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 1 Plan 02: ArcGIS Client Error Handling Summary

**Three ArcGIS REST clients patched to raise typed ApiError on API-level errors, making error conditions distinguishable from genuine empty results and observable in logs**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-01T15:28:20Z
- **Completed:** 2026-03-01T15:29:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced silent `logger.warning + return []` with `raise ApiError("arcgis_error", ...)` in all three ArcGIS clients
- ApiError carries ArcGIS error code via `status=err.get("code")` for structured error context
- Removed now-unused `import logging` and `logger` variable from all three files after removing warning calls
- All three clients pass `uv run ruff check src/` cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Raise ApiError in naturvern.py and grunnforurensning.py** - `6483ba8` (fix)
2. **Task 2: Raise ApiError in kulturminner.py; remove unused logging imports** - `4590c49` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/src/app/clients/naturvern.py` - Import ApiError, raise on "error" in data, removed unused logging
- `backend/src/app/clients/grunnforurensning.py` - Import ApiError, raise on "error" in data, removed unused logging
- `backend/src/app/clients/kulturminner.py` - Import ApiError, raise on "error" in data, removed unused logging

## Decisions Made

- Raise `ApiError("arcgis_error", ...)` instead of silent `return []` so API errors are distinguishable from genuine empty geometry results
- Removed `import logging` / `logger` variable from all three clients after the `logger.warning` call was removed — import cleanup is required by ruff
- The `data is None` path (network-level failure) is unchanged and still returns `[]` — this is already handled by `fetch_json` which logs internally

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused logging imports introduced by the change**
- **Found during:** Task 2 (ruff check after kulturminner.py edit)
- **Issue:** Removing `logger.warning(...)` left `import logging` and `logger = logging.getLogger(__name__)` as dead code; ruff reported 3 errors (one per file)
- **Fix:** Removed `import logging` and `logger = logging.getLogger(__name__)` from all three files
- **Files modified:** naturvern.py, grunnforurensning.py, kulturminner.py
- **Verification:** `uv run ruff check src/ --no-cache` exits 0 with "All checks passed!"
- **Committed in:** `4590c49` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - unused imports from the change itself)
**Impact on plan:** Necessary cleanup — the plan's own edits introduced unused imports that would fail ruff. No scope creep.

## Issues Encountered

None — plan executed cleanly after removing the unused logging imports introduced by the change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three ArcGIS clients now raise `ApiError` on API errors, allowing `feature_info.py` to log and degrade gracefully
- `feature_info.py` service already handles `BaseException` via `return_exceptions=True` — no changes needed there
- Ready for remaining correctness work (type fixes, coordinate validation, Zod validation)

---
*Phase: 01-backend-correctness*
*Completed: 2026-03-01*

## Self-Check: PASSED

- FOUND: backend/src/app/clients/naturvern.py
- FOUND: backend/src/app/clients/grunnforurensning.py
- FOUND: backend/src/app/clients/kulturminner.py
- FOUND: .planning/phases/01-backend-correctness/01-02-SUMMARY.md
- FOUND commit: 6483ba8 (Task 1)
- FOUND commit: 4590c49 (Task 2)
