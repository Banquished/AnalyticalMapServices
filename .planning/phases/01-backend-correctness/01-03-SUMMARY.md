---
phase: 01-backend-correctness
plan: 03
subsystem: api
tags: [fastapi, error-handling, http-exceptions, routers]

# Dependency graph
requires: []
provides:
  - Consistent try/except wrappers on all router endpoints
  - HTTP 502 for upstream ApiError/TimeoutException on all endpoints
  - HTTP 422 guard for missing coordinates in search_properties
affects: [02-frontend-robustness, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Router error handling: every endpoint body wrapped in try/except (ApiError, httpx.TimeoutException) -> HTTP 502"
    - "HTTPException re-raise: raise HTTPException before generic except to preserve 422 vs 502 semantics"
    - "Coordinate guard: explicit 422 before point-search branch when ost/nord are None"

key-files:
  created: []
  modified:
    - backend/src/app/routers/addresses.py
    - backend/src/app/routers/properties.py
    - backend/src/app/routers/feature_info.py

key-decisions:
  - "Re-raise HTTPException before the ApiError/TimeoutException catch to preserve 422 semantics (coordinate guard) vs 502 (upstream failure)"
  - "Wrap get_geokoding_endpoint too — not explicitly required by plan but consistent with all-endpoints policy"

patterns-established:
  - "Router error pattern: try: ... except HTTPException: raise / except (ApiError, httpx.TimeoutException) as exc: raise HTTPException(502)"

requirements-completed: [ERR-02, ERR-03]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 01 Plan 03: Router Error Handling Summary

**Consistent HTTP 502 wrappers added to all unprotected router endpoints; silent 0.0 coordinate default replaced with explicit HTTP 422 validation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-01T15:28:23Z
- **Completed:** 2026-03-01T15:30:10Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- `search_addresses_endpoint` now returns HTTP 502 (not unhandled 500) on upstream failure
- `search_properties` raises HTTP 422 with descriptive message when coordinates absent and no matrikkel params provided; silent `0.0` fallback removed
- All 3 endpoints in `properties.py` and `get_feature_info` wrapped with consistent `ApiError`/`httpx.TimeoutException` handler
- Total of 6 `except (ApiError, httpx.TimeoutException)` blocks across 3 router files; `ruff check src/` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap search_addresses_endpoint** - `6483ba8` (fix)
2. **Task 2: Fix properties.py wrappers + 0.0 default** - `b941001` (fix)
3. **Task 3: Wrap get_feature_info** - `1e06239` (fix)

## Files Created/Modified
- `backend/src/app/routers/addresses.py` - Added try/except to search_addresses_endpoint
- `backend/src/app/routers/properties.py` - Added httpx/HTTPException/ApiError imports; replaced 0.0 defaults with 422 guard; wrapped all 3 endpoints
- `backend/src/app/routers/feature_info.py` - Added httpx/HTTPException/ApiError imports; wrapped get_feature_info

## Decisions Made
- Re-raise `HTTPException` before the generic except block so the 422 coordinate guard is not accidentally converted to a 502. Pattern: `except HTTPException: raise` then `except (ApiError, httpx.TimeoutException) as exc: raise HTTPException(502)`.
- Also wrapped `get_geokoding_endpoint` (not explicitly called out in task description but consistent with all-endpoints policy and clearly correct).
- Fixed ruff I001 import ordering in feature_info.py as part of the same task commit.

## Deviations from Plan

None - plan executed exactly as written. The ruff import-sort fix on feature_info.py was an inline correction triggered while applying the planned changes (Rule 1 — auto-fix).

## Issues Encountered
- Ruff I001 import ordering on feature_info.py: `import httpx` placed before `from typing import Annotated` violated isort rules. Fixed inline by moving `from typing import Annotated` to the top (stdlib group before third-party).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All router endpoints now have consistent error handling
- Backend ready for robustness improvements in Phase 2 (frontend error handling)
- ERR-02 and ERR-03 requirements satisfied

## Self-Check: PASSED

- FOUND: backend/src/app/routers/addresses.py
- FOUND: backend/src/app/routers/properties.py
- FOUND: backend/src/app/routers/feature_info.py
- FOUND: .planning/phases/01-backend-correctness/01-03-SUMMARY.md
- FOUND: commit 6483ba8 (Task 1)
- FOUND: commit b941001 (Task 2)
- FOUND: commit 1e06239 (Task 3)

---
*Phase: 01-backend-correctness*
*Completed: 2026-03-01*
