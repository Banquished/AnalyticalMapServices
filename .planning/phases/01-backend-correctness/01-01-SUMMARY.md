---
phase: 01-backend-correctness
plan: 01
subsystem: api
tags: [mypy, typing, overload, strict, python, fastapi]

# Dependency graph
requires: []
provides:
  - "@overload-discriminated _fetch_with_retry with Literal[True|False] for dict|None vs str|None"
  - "Properly typed _safe[T] generic with Callable[[], T] binding"
  - "cast(list[dict[str,Any]]) replacing type: ignore in _rest()"
  - "[tool.mypy] strict=true section in pyproject.toml"
affects: [02-backend-correctness, future type-checking CI]

# Tech tracking
tech-stack:
  added: [mypy>=1.10 (dev extra), typing.overload, typing.Literal, collections.abc.Callable]
  patterns:
    - "@overload + Literal discrimination for runtime-bool parameter that controls return type"
    - "cast() at gather() result boundaries where asyncio.gather return type is Any"
    - "Callable[[], T] annotation for zero-arg callables in generic helpers"

key-files:
  created: []
  modified:
    - backend/src/app/clients/http.py
    - backend/src/app/services/feature_info.py
    - backend/pyproject.toml

key-decisions:
  - "Use @overload + Literal[True/False] for _fetch_with_retry rather than separate internal functions — preserves existing call sites"
  - "Use cast() rather than type guards at asyncio.gather() result boundaries — gather returns tuple[Unknown] under strict mode"
  - "strict=true in [tool.mypy] with ignore_missing_imports=true — avoids stub noise for third-party libs not yet fully annotated"

patterns-established:
  - "Overload pattern: two @overload stubs precede implementation, implementation signature uses bool not Literal"
  - "Gather cast pattern: isinstance(result, BaseException) guard + cast() to expected type"

requirements-completed: [TYPES-01, TYPES-02]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 1 Plan 01: Type Safety — http.py and feature_info.py Summary

**Removed all `# type: ignore` suppressions from `http.py` and `feature_info.py` using `@overload` + `Literal` discrimination and `cast()`, with mypy strict mode enforced via `pyproject.toml`.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T15:28:13Z
- **Completed:** 2026-03-01T15:31:28Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added `@overload` stubs with `Literal[True]`/`Literal[False]` discrimination for `_fetch_with_retry`, eliminating both `# type: ignore[return-value]` comments from `fetch_text` and `fetch_json`
- Annotated `_safe[T]`'s `fn` parameter as `Callable[[], T]` so mypy correctly binds `T` from the callable's return type, and replaced `# type: ignore[return-value]` in `_rest()` with `cast(list[dict[str, Any]], result)`
- Added `[tool.mypy]` section to `pyproject.toml` with `strict = true` and `ignore_missing_imports = true`, making strict checking reproducible via `uv run mypy`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add @overload to _fetch_with_retry in http.py** - `02d8287` (fix)
2. **Task 2: Fix _safe[T] generic and _rest() cast in feature_info.py** - `3133aac` (fix)
3. **Task 3: Add [tool.mypy] section to pyproject.toml** - `adbeca2` (chore)

## Files Created/Modified
- `backend/src/app/clients/http.py` - Added `overload`/`Literal` imports, two `@overload` stubs, parameterized `dict[str, Any]` return types
- `backend/src/app/services/feature_info.py` - Added `Callable`/`cast`/`Any` imports, annotated `_safe[T]`, added `cast()` in `_rest()` and cache hit path
- `backend/pyproject.toml` - Added `[tool.mypy]` section with `strict = true`, `python_version = "3.12"`, `ignore_missing_imports = true`

## Decisions Made
- Used `@overload` + `Literal` discrimination for `_fetch_with_retry` rather than splitting into separate functions — avoids any changes to the 10+ call sites across the codebase
- Used `cast()` at `asyncio.gather()` result boundaries rather than type guards — `gather()` returns a tuple of `Unknown` under strict mode; narrowing with `isinstance` handles exceptions but not the positive case
- Set `ignore_missing_imports = true` in mypy config to avoid stub noise for `httpx`, `cachetools`, and other third-party deps that may lack stubs in the dev environment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added cast for WMS gather result assignment in feature_info.py**
- **Found during:** Task 2 (Fix _safe[T] generic and _rest() cast)
- **Issue:** `raw_results[ep.result_key] = result` failed under strict mypy because `asyncio.gather()` result type includes `list[dict]` from REST tasks; the `isinstance(BaseException)` guard narrows but still leaves `str | list[dict[str,Any]] | None`
- **Fix:** Added `cast(str | None, result)` on the WMS result assignment path
- **Files modified:** `backend/src/app/services/feature_info.py`
- **Verification:** `uv run mypy src/app/services/feature_info.py` passes
- **Committed in:** `3133aac` (Task 2 commit)

**2. [Rule 1 - Bug] Parameterized bare `dict` return types in http.py under strict mode**
- **Found during:** Task 3 (Add [tool.mypy] section)
- **Issue:** Strict mode enables `--disallow-any-generics`; bare `dict` in overload stubs and `fetch_json`/`fetch_json_strict` return types triggered `[type-arg]` errors
- **Fix:** Changed `dict` → `dict[str, Any]` in all four affected signatures
- **Files modified:** `backend/src/app/clients/http.py`
- **Verification:** `uv run mypy src/app/clients/http.py` passes under strict
- **Committed in:** `adbeca2` (Task 3 commit)

**3. [Rule 1 - Bug] Added cast for TTLCache lookup return in feature_info.py**
- **Found during:** Task 3 (Add [tool.mypy] section)
- **Issue:** `cachetools.TTLCache` is not generically annotated; cache item access returns `Any`, causing `no-any-return` under strict mode on the cache-hit early return
- **Fix:** Wrapped cache lookup with `cast(FeatureInfoData, cache[cache_key])`
- **Files modified:** `backend/src/app/services/feature_info.py`
- **Verification:** `uv run mypy src/app/services/feature_info.py` passes under strict
- **Committed in:** `adbeca2` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs exposed by strict mode activation)
**Impact on plan:** All fixes necessary to achieve `strict = true` compliance. No scope creep — all changes confined to the two target files.

## Issues Encountered
- mypy not available via `uv run mypy` until `uv sync --extra dev` was run (dev extras were not synced). Resolved by syncing dev dependencies — this is a one-time setup step.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both target files pass `uv run mypy` under `strict = true` with zero suppressions
- `pyproject.toml` now has reproducible mypy configuration for CI integration
- Pattern established for `@overload` + `Literal` discrimination and `cast()` at async gather boundaries — ready to apply to other files in subsequent plans

---
*Phase: 01-backend-correctness*
*Completed: 2026-03-01*

## Self-Check: PASSED

- FOUND: `.planning/phases/01-backend-correctness/01-01-SUMMARY.md`
- FOUND: `backend/src/app/clients/http.py`
- FOUND: `backend/src/app/services/feature_info.py`
- FOUND: `backend/pyproject.toml`
- FOUND: commit `02d8287` (Task 1)
- FOUND: commit `3133aac` (Task 2)
- FOUND: commit `adbeca2` (Task 3)
