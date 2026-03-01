# AMS Security & Bug Fix Plan

> Extracted from the larger audit plan. Focused scope only — no renames.
> Execute with subagents to keep context small.

---

## Phase 5 — Security & Type Safety

### 5.1 Coordinate bounds validation
**File:** `backend/src/app/routers/properties.py`

`ost`/`nord` query params accept any float with no bounds — silent 500 on downstream APIs.

```python
from typing import Annotated
from fastapi import Query

# Route signature:
east: Annotated[float | None, Query(ge=-180.0, le=180.0)] = None,
north: Annotated[float | None, Query(ge=-90.0,  le=90.0)]  = None,
# If both missing → raise HTTPException(status_code=422, ...)
```

**Test:** `curl "http://localhost:8000/api/v1/properties/areas?ost=9999&nord=0"` → 422

---

### 5.2 Sanitize error messages exposed to clients
**Files:** `backend/src/app/main.py`, `routers/properties.py`, `routers/addresses.py`

`str(exc)` in HTTP responses leaks internal details.

```python
# Before:
raise HTTPException(status_code=502, detail=str(exc)) from exc
# After:
logger.error("Upstream error: %s", exc, exc_info=True)
raise HTTPException(status_code=502, detail="Upstream service unavailable") from exc
```

---

### 5.3 Tighten CORS policy
**File:** `backend/src/app/main.py`

```python
# Before:
allow_credentials=True,
allow_headers=["*"],
# After:
allow_credentials=False,
allow_headers=["Content-Type", "Accept"],
```

---

### 5.4 Remove unsafe `as unknown as` double casts
**Files:**
- `frontend/src/features/map/api/addressSearch.ts`
- `frontend/src/features/map/domain/propertyLookup.ts`
- `frontend/src/features/map/hooks/useFeatureInfo.ts`

Zod `.parse()` already returns the typed output — the `as unknown as T` cast hides mismatches.

```typescript
// Before:
return SomeSchema.parse(raw) as unknown as SomeType;
// After:
return SomeSchema.parse(raw);
// (fix the return type annotation if TS complains — don't add a cast)
```

---

### 5.5 Add type guards for ArcGIS feature unpacking
**Files:** `backend/src/app/clients/kulturminner.py`, `naturvern.py`, `grunnforurensning.py`, `stoy.py`

```python
# Before:
return [f["attributes"] for f in data.get("features", [])]
# After:
features = data.get("features", [])
if not isinstance(features, list):
    logger.warning("Unexpected ArcGIS response format")
    return []
return [f["attributes"] for f in features if isinstance(f, dict) and "attributes" in f]
```

---

## Phase 6 — Logic Bug Fixes

### 6.1 Raise ApiError consistently in ArcGIS clients
**Files:** `backend/src/app/clients/stoy.py`, `kulturminner.py`, `naturvern.py`

Currently returns `[]` silently on API error — callers can't distinguish "no results" from "failure".

```python
if "error" in data:
    err = data["error"]
    raise ApiError(
        "arcgis",
        str(err.get("message", "unknown")) if isinstance(err, dict) else str(err),
        _BASE_URL,
    )
```

---

### 6.2 Fix coordinate zero-check in useFeatureInfo
**File:** `frontend/src/features/map/hooks/useFeatureInfo.ts` (lines ~54-58)

`?? 0` means a genuine (0,0) coordinate is silently rejected.

```typescript
// Before:
const lat = activeItem?.lat ?? 0;
const lng = activeItem?.lng ?? 0;
if (!key || lat === 0 || lng === 0) return;
// After:
const lat = activeItem?.lat ?? null;
const lng = activeItem?.lng ?? null;
if (!key || lat === null || lng === null) return;
```

---

## Verification

```bash
# Backend
cd backend && uv run ruff check . && uv run uvicorn app.main:app --reload
curl "http://localhost:8000/api/v1/properties/areas?ost=9999" # → 422
curl "http://localhost:8000/api/v1/feature-info?lat=59.9&lng=10.7" # → 200

# Frontend
cd frontend && npx tsc --noEmit && npm run build
```

## Commit strategy (one commit per sub-task)
- `fix(backend): add coordinate bounds validation to properties router`
- `fix(backend): sanitize error responses to prevent information disclosure`
- `fix(backend): tighten CORS headers`
- `fix(frontend): remove unsafe double casts after Zod validation`
- `fix(backend): add type guards for ArcGIS feature attribute unpacking`
- `fix(backend): raise ApiError consistently in ArcGIS clients`
- `fix(frontend): use null sentinel instead of 0 for missing coordinates`
