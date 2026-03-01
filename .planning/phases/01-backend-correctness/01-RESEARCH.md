# Phase 1: Backend Correctness - Research

**Researched:** 2026-03-01
**Domain:** Python/FastAPI — type annotations, `@overload`, generic functions, error handling
**Confidence:** HIGH (all findings verified directly from source files)

---

## Summary

Phase 1 has exactly 5 requirements affecting 6 files: `http.py`, `feature_info.py`, three ArcGIS
clients (`naturvern.py`, `grunnforurensning.py`, `kulturminner.py`), and three routers (`addresses.py`,
`properties.py`, `feature_info.py`). Every problem is already fully visible in the current source —
no new dependencies are needed, and no architectural changes are required.

The type suppression problems in `http.py` and `feature_info.py` both stem from the same root cause:
a single function that returns different types depending on a runtime flag cannot express that
relationship in a plain function signature. The fix is `@overload` for `_fetch_with_retry` and
proper typing for `_safe[T]`. The error-handling gaps are straightforward: three ArcGIS clients swallow
API-level errors silently, four router endpoints lack a consistent `try/except` wrapper, and one
endpoint has a silent 0.0 coordinate default.

**Primary recommendation:** Make all 5 changes as targeted surgical diffs. No new libraries
required. `ApiError` already exists in `http.py` — reuse it everywhere.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TYPES-01 | `_fetch_with_retry` in `http.py` refactored with `@overload`; callers no longer need `# type: ignore` | `@overload` pattern documented below; existing `str \| dict \| None` return is the root cause |
| TYPES-02 | `_safe[T]` generic in `feature_info.py` properly binds return type; `_rest()` type mismatch resolved | PEP 695 type param + `Callable` annotation pattern documented below |
| ERR-01 | ArcGIS REST clients raise typed error on API-level errors instead of silent `[]` | `ApiError` already exists in `http.py`; raise pattern documented below |
| ERR-02 | All router endpoints consistently catch `ApiError` + `httpx.TimeoutException` → `HTTPException` | Consistent wrapper pattern and error shape documented below |
| ERR-03 | `search_properties` endpoint `ost`/`nord` made required; missing params return HTTP 422 | FastAPI `Query(...)` pattern documented below; the exact line is identified |
</phase_requirements>

---

## Standard Stack

### Core (already installed, no new deps needed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| FastAPI | >=0.115 | Web framework, `HTTPException`, `Query` | Already in use |
| Pydantic | >=2.10 | Settings, type validation | Already in use |
| httpx | >=0.28 | Async HTTP client | Already in use |
| mypy | >=1.10 | Static type checking (dev dep) | In `[project.optional-dependencies].dev` |
| ruff | >=0.4 | Lint (does not type-check; mypy/pyright needed for `# type: ignore` removal) | In dev deps |

**Important:** `ruff check` alone will NOT catch the `# type: ignore` suppressions — it only reports
unused ignores if you add `[tool.ruff.lint] extend-select = ["PGH"]` or run `mypy`/`pyright`. The
success criterion says "mypy or pyright runs clean" — mypy is already in dev deps, so use that.

**Installation:** No new packages needed. To run type checks:
```bash
cd backend && uv run mypy src/app/clients/http.py src/app/services/feature_info.py
```

---

## Architecture Patterns

### Pattern 1: `@overload` for runtime-conditional return types (TYPES-01)

**What:** When a single function returns different types based on a `bool` flag, mypy cannot infer
the correct type from the call site. `@overload` provides typed overload signatures that mypy uses
for call-site inference, while the actual implementation keeps the union return type.

**Root cause in `http.py`:**
```python
# Current — returns str | dict | None depending on parse_json flag
async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: bool,      # <-- bool flag
) -> str | dict | None:   # <-- mypy can't narrow from call site
    ...
    return resp.json() if parse_json else resp.text
```

`fetch_text` calls `_fetch_with_retry(..., parse_json=False)` but declares `-> str | None`.
mypy sees the return as `str | dict | None` and flags the mismatch — hence `# type: ignore[return-value]`.

**Fix — `@overload` with `Literal` discrimination:**
```python
# Source: Python docs — typing.overload
from typing import overload, Literal

@overload
async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: Literal[True],
) -> dict | None: ...

@overload
async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: Literal[False],
) -> str | None: ...

async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: bool,
) -> str | dict | None:
    # implementation unchanged
    ...
```

With this in place, `fetch_text` calling `parse_json=False` resolves to `str | None` — matching
its declared return — and `fetch_json` calling `parse_json=True` resolves to `dict | None`. Both
`# type: ignore[return-value]` suppressions are removed cleanly.

**Confidence:** HIGH — standard Python typing pattern, verified against Python docs.

---

### Pattern 2: Typed `_safe[T]` generic (TYPES-02)

**What:** The current `_safe[T]` function in `feature_info.py` uses PEP 695 type parameter syntax
(Python 3.12+) but `fn` is typed as a bare untyped callable. The return type `T | None` is correct
in intent but mypy cannot bind `T` because `fn` has no typed annotation.

**Current code:**
```python
def _safe[T](fn) -> T | None:   # fn has no type annotation
    try:
        return fn()
    except Exception as exc:
        logger.warning("Parser %s failed: %s", fn.__name__, exc, exc_info=True)
        return None
```

**Fix — annotate `fn` with `Callable[[], T]`:**
```python
from collections.abc import Callable

def _safe[T](fn: Callable[[], T]) -> T | None:
    try:
        return fn()
    except Exception as exc:
        logger.warning("Parser %s failed: %s", fn.__name__, exc, exc_info=True)
        return None
```

With `fn: Callable[[], T]`, mypy can bind `T` from the lambda passed in, making the return type
`T | None` concrete at each call site.

**The `_rest()` type ignore:**
```python
def _rest(idx: int) -> list[dict]:
    result = all_results[n_wms + idx]
    if isinstance(result, BaseException):
        ...
        return []
    return result  # type: ignore[return-value]  ← result is Any from asyncio.gather
```

`asyncio.gather(*tasks, return_exceptions=True)` returns `tuple[BaseException | Any, ...]`, so
`result` is typed `Any`. The `# type: ignore` is papering over the fact that `Any` is not narrowed
to `list[dict]`. Fix: add an `isinstance` check or a cast with a comment explaining the invariant:

```python
from typing import cast

def _rest(idx: int) -> list[dict]:
    result = all_results[n_wms + idx]
    if isinstance(result, BaseException):
        logger.warning("REST query %d failed: %s", idx, result)
        return []
    # result is guaranteed list[dict] — return type of the REST client functions
    return cast(list[dict], result)
```

`cast` is the right tool here: it is not a `# type: ignore` (it is a typed assertion), mypy
accepts it without suppression, and it documents the invariant in code.

**Confidence:** HIGH — verified against Python typing docs and PEP 695.

---

### Pattern 3: Raise typed errors in ArcGIS clients (ERR-01)

**What:** All three ArcGIS clients (`naturvern.py`, `grunnforurensning.py`, `kulturminner.py`) have
identical structure:
```python
if data is None:
    return []
if "error" in data:
    logger.warning("API error from %s: %s", _BASE_URL, data.get("error"))
    return []   # <-- silent failure, indistinguishable from "no results"
```

The success criterion says callers must be able to distinguish "API returned an error" from
"no features found". The `ApiError` class already exists in `http.py`.

**Fix — raise `ApiError` on API-level error:**
```python
from app.clients.http import ApiError, fetch_json

async def query_naturvern(lat: float, lng: float) -> list[dict]:
    data = await fetch_json(url, params)
    if data is None:
        return []   # network/HTTP failure already logged by fetch_json
    if "error" in data:
        err = data.get("error", {})
        raise ApiError(
            "arcgis_error",
            f"ArcGIS error from {_BASE_URL}: {err}",
            status=err.get("code") if isinstance(err, dict) else None,
        )
    return [f["attributes"] for f in data.get("features", [])]
```

**Important downstream consideration:** `feature_info.py` calls these clients inside
`asyncio.gather(..., return_exceptions=True)`. The `_rest()` helper already handles `BaseException`
instances — it logs and returns `[]`. So raising `ApiError` from the clients will cause `_rest()` to
log a warning and degrade gracefully without crashing the whole request. This is correct behaviour.
No changes to `_rest()` in `feature_info.py` are needed for ERR-01 beyond the cast fix.

**Confidence:** HIGH — traced through full call stack.

---

### Pattern 4: Consistent router error handling (ERR-02)

**What:** `addresses.py` `reverse_geocode` already has the correct pattern:
```python
try:
    return await service_fn(...)
except (ApiError, httpx.TimeoutException) as exc:
    raise HTTPException(status_code=502, detail=str(exc)) from exc
```

But `search_addresses_endpoint` has no try/except. `feature_info.py` router has no error handling.
`properties.py` both endpoints have no error handling.

**Target error shape (consistent JSON):** FastAPI's default `HTTPException` produces:
```json
{"detail": "message string"}
```

This is acceptable as the consistent shape — no need to invent a custom error envelope. The
`detail` field should contain `str(exc)` from `ApiError` or `httpx.TimeoutException`.

**Fix — wrap each endpoint body:**
```python
# Pattern to apply to all uncovered endpoints
from app.clients.http import ApiError
import httpx
from fastapi import HTTPException

@router.get("/addresses/search")
async def search_addresses_endpoint(...) -> dict:
    try:
        return await addresses_search(...)
    except (ApiError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
```

For `feature_info.py` router, the service function already swallows individual parser failures via
`_safe()` and gather `return_exceptions=True`. The only remaining unhandled case is if the whole
`fetch_feature_info` call raises unexpectedly. Wrap it similarly.

**HTTP status code guidance:**
- `ApiError` (upstream service failure): 502 Bad Gateway
- `httpx.TimeoutException`: 504 Gateway Timeout is more precise, but 502 is acceptable for
  consistency. Use 504 if you want to be semantically precise.

**Confidence:** HIGH — pattern already proven in `reverse_geocode`.

---

### Pattern 5: Required FastAPI query params (ERR-03)

**What:** `search_properties` in `properties.py` currently declares:
```python
ost: float | None = Query(None, ...)
nord: float | None = Query(None, ...)
```
Then falls back: `ost=ost if ost is not None else 0.0` — silent 0.0 default when a point search
is requested without coordinates.

**The fix location:** The endpoint has TWO branches: matrikkel lookup and point search. When
neither matrikkel identifiers nor coordinates are provided, the current code silently uses `(0, 0)`.

**Correct fix — validate at the router level before delegating:**
```python
@router.get("/properties/search")
async def search_properties(
    ost: float | None = Query(None, description="Longitude / East (WGS84)"),
    nord: float | None = Query(None, description="Latitude / North (WGS84)"),
    ...
) -> dict:
    if matrikkelnummer or kommunenummer or gardsnummer:
        return await geokoding(...)
    # Point search — coordinates are required
    if ost is None or nord is None:
        raise HTTPException(
            status_code=422,
            detail="ost and nord are required for point-based property search",
        )
    return await properties_by_point(ost=ost, nord=nord, ...)
```

**Note on `get_property_areas`:** This endpoint (`/properties/areas`) already correctly uses
`Query(...)` (required, no default) for both `ost` and `nord`. FastAPI automatically returns 422
if they are missing. This endpoint does NOT need changing — the requirement already satisfied.

**Why not just use `Query(...)` for `search_properties`?** The endpoint serves double duty (matrikkel
OR point). Making `ost`/`nord` required at the param level would break matrikkel-only calls. The
manual validation at the branch level is the right approach.

**Confidence:** HIGH — confirmed by reading the full endpoint implementation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Typed overload dispatch | Custom wrapper class | `typing.overload` + `Literal` | Standard Python pattern, zero overhead |
| Generic typed callable | `Protocol` class | `Callable[[], T]` | Simpler, equivalent for this use case |
| Error envelope shape | Custom `ErrorResponse` Pydantic model | FastAPI's `HTTPException` default `{"detail": ...}` | Consistent with FastAPI convention; frontend already handles it |
| Type narrowing after gather | `isinstance` dance | `typing.cast` | Signals intent, no runtime cost |

**Key insight:** All required tools are already in the standard library or already-installed
packages. This phase is purely about correctly using what's already there.

---

## Common Pitfalls

### Pitfall 1: `@overload` placement order
**What goes wrong:** Putting the implementation signature before the overloads causes mypy to not
recognize the overloads.
**How to avoid:** Always put ALL `@overload` decorated signatures BEFORE the plain implementation.
**Warning signs:** mypy error "Overloaded function signature N will never be matched".

### Pitfall 2: `@overload` in the implementation signature
**What goes wrong:** Adding `@overload` to the implementation (the one with the actual body).
**How to avoid:** The implementation signature has NO `@overload` decorator. Only the stub
signatures get `@overload`.

### Pitfall 3: Raising `ApiError` in ArcGIS clients breaks `feature_info.py` gather
**What goes wrong:** You raise `ApiError` in a client, but `feature_info.py` doesn't use
`return_exceptions=True`, causing the whole gather to fail.
**Why it doesn't apply here:** `feature_info.py` already uses `return_exceptions=True` AND
`_rest()` already handles `BaseException`. Raising `ApiError` is safe and degrades gracefully.
**Verify:** `all_results = await asyncio.gather(*wms_tasks, *rest_tasks, return_exceptions=True)`
— the `return_exceptions=True` is present on line 81.

### Pitfall 4: `_safe[T]` PEP 695 syntax vs mypy support
**What goes wrong:** PEP 695 (`def _safe[T](...)`) requires Python 3.12 AND mypy 1.9+. Older mypy
versions don't support this syntax and will error.
**Why it doesn't apply here:** `pyproject.toml` specifies `requires-python = ">=3.12"` and
`mypy>=1.10` — both in range. PEP 695 is safe to use.

### Pitfall 5: `search_addresses_endpoint` — the service may not raise `ApiError`
**What goes wrong:** Wrapping the endpoint in `except ApiError` but the service uses `fetch_json`
which returns `None` on failure (not raises). The error gets swallowed before reaching the router.
**How to avoid:** Check whether the service uses `fetch_json` (returns None) or `fetch_json_strict`
(raises `ApiError`). For ERR-02, the router wrapping only catches errors that actually propagate.
If the service returns `None` or an empty dict on error, the router wrapper adds safety but may
not fire. This is acceptable — the requirement is about consistent handling when errors DO reach
the router, not about changing service internals.

---

## Code Examples

### `@overload` with `Literal` (TYPES-01)
```python
# Source: Python docs — https://docs.python.org/3/library/typing.html#typing.overload
from typing import overload, Literal, Any

@overload
async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: Literal[True],
) -> dict | None: ...

@overload
async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: Literal[False],
) -> str | None: ...

async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: bool,
) -> str | dict | None:
    # implementation body unchanged
    ...
```

### `_safe[T]` with `Callable` (TYPES-02)
```python
from collections.abc import Callable

def _safe[T](fn: Callable[[], T]) -> T | None:
    try:
        return fn()
    except Exception as exc:
        logger.warning("Parser %s failed: %s", fn.__name__, exc, exc_info=True)
        return None
```

### `_rest()` with `cast` (TYPES-02)
```python
from typing import cast

def _rest(idx: int) -> list[dict]:
    result = all_results[n_wms + idx]
    if isinstance(result, BaseException):
        logger.warning("REST query %d failed: %s", idx, result)
        return []
    return cast(list[dict], result)
```

### ArcGIS client raise pattern (ERR-01)
```python
from app.clients.http import ApiError, fetch_json

async def query_naturvern(lat: float, lng: float) -> list[dict]:
    url = f"{_BASE_URL}/{_LAYER_ID}/query"
    params = {...}
    data = await fetch_json(url, params)
    if data is None:
        return []
    if "error" in data:
        err = data.get("error", {})
        raise ApiError(
            "arcgis_error",
            f"ArcGIS error from {_BASE_URL}: {err}",
            status=err.get("code") if isinstance(err, dict) else None,
        )
    return [f["attributes"] for f in data.get("features", [])]
```

### Router error wrapper (ERR-02)
```python
from app.clients.http import ApiError
import httpx
from fastapi import HTTPException

try:
    return await service_fn(...)
except (ApiError, httpx.TimeoutException) as exc:
    raise HTTPException(status_code=502, detail=str(exc)) from exc
```

### Required-but-conditional query param (ERR-03)
```python
# ost / nord declared as Optional at param level (matrikkel branch doesn't need them)
# but validated manually when point search is chosen
if ost is None or nord is None:
    raise HTTPException(
        status_code=422,
        detail="ost and nord are required for point-based property search",
    )
```

---

## File-by-File Change Map

| File | Requirement | Change |
|------|-------------|--------|
| `backend/src/app/clients/http.py` | TYPES-01 | Add `@overload` + `Literal` overloads for `_fetch_with_retry`; remove 2x `# type: ignore[return-value]` from `fetch_text`/`fetch_json` |
| `backend/src/app/services/feature_info.py` | TYPES-02 | Add `Callable[[], T]` annotation to `_safe`; replace `# type: ignore[return-value]` in `_rest()` with `cast(list[dict], result)` |
| `backend/src/app/clients/naturvern.py` | ERR-01 | Replace `return []` on `"error" in data` with `raise ApiError(...)` |
| `backend/src/app/clients/grunnforurensning.py` | ERR-01 | Replace `return []` on `"error" in data` with `raise ApiError(...)` |
| `backend/src/app/clients/kulturminner.py` | ERR-01 | Replace `return []` on `"error" in data` with `raise ApiError(...)` |
| `backend/src/app/routers/addresses.py` | ERR-02 | Wrap `search_addresses_endpoint` body in `try/except (ApiError, httpx.TimeoutException)` |
| `backend/src/app/routers/feature_info.py` | ERR-02 | Wrap `get_feature_info` body in `try/except (ApiError, httpx.TimeoutException)` |
| `backend/src/app/routers/properties.py` | ERR-02, ERR-03 | Wrap both endpoints; add `if ost is None or nord is None: raise HTTPException(422, ...)` in `search_properties` |

Total: 8 file edits, all surgical diffs.

---

## Open Questions

1. **mypy config — does it exist?**
   - What we know: `pyproject.toml` has `mypy>=1.10` in dev deps but no `[tool.mypy]` section.
   - What's unclear: Without a `[tool.mypy]` config, mypy runs with default settings. Default
     settings are not strict; may not flag all issues. The `# type: ignore` suppressions will be
     removed, but mypy may not catch new regressions without `--strict`.
   - Recommendation: Add a minimal `[tool.mypy]` section to `pyproject.toml` as part of this phase,
     or run `mypy --strict` in the success-criterion check command.

2. **`asyncio.gather` return type narrowing**
   - What we know: `asyncio.gather(..., return_exceptions=True)` returns `list[T | BaseException]`
     but mypy often types it as `list[Any]` in practice.
   - What's unclear: Whether adding `cast` will fully satisfy mypy or whether a type-narrowing
     `assert isinstance(result, list)` is needed.
   - Recommendation: Use `cast(list[dict], result)` — this is the standard documented approach.
     Run `mypy` to verify after the change.

---

## Sources

### Primary (HIGH confidence)
- Direct source code reading — all findings come from the actual files in this repo, not inference
- Python docs: `typing.overload` — https://docs.python.org/3/library/typing.html#typing.overload
- Python docs: PEP 695 type parameter syntax — https://peps.python.org/pep-0695/
- FastAPI docs: `HTTPException` — https://fastapi.tiangolo.com/tutorial/handling-errors/
- FastAPI docs: `Query` required params — https://fastapi.tiangolo.com/tutorial/query-params/

### Secondary (MEDIUM confidence)
- mypy docs: overloads — https://mypy.readthedocs.io/en/stable/more_types.html#function-overloading
- mypy docs: `cast` — https://mypy.readthedocs.io/en/stable/duck_type_compatibility.html#casts

---

## Metadata

**Confidence breakdown:**
- TYPES-01: HIGH — standard `@overload` + `Literal` pattern, root cause confirmed in source
- TYPES-02: HIGH — PEP 695 + `Callable[[], T]` fix confirmed; `cast` for `_rest()` standard
- ERR-01: HIGH — ArcGIS client structure confirmed; `ApiError` already exists; gather behavior confirmed
- ERR-02: HIGH — pattern confirmed from `reverse_geocode` which already implements it correctly
- ERR-03: HIGH — exact lines identified in `properties.py`; endpoint semantics fully traced

**Research date:** 2026-03-01
**Valid until:** Stable — no external APIs involved, all findings from local source code
