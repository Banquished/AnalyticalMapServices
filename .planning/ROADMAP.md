# Roadmap: AnalyticalMapServices

## Milestones

- 🚧 **v1.1 Code Quality & Deployment Readiness** — Phases 1-4 (in progress)
- 📋 **v2.0 Sweco Port** — Phases 5+ (planned)

## Phases

### 🚧 v1.1 Code Quality & Deployment Readiness (In Progress)

**Milestone goal:** Clean architecture, correct types, explicit error handling, and a working Docker Compose stack — ready for Sweco to run and port.

- [ ] **Phase 1: Backend Correctness** - Eliminate type suppressions and silent errors in the Python backend
- [ ] **Phase 2: Frontend Architecture Split** - Break oversized components along layer boundaries
- [ ] **Phase 3: Frontend Polish & Zod Validation** - DRY helpers, explicit return types, runtime API validation
- [ ] **Phase 4: Docker & Deployment Readiness** - Containerize, document env vars, audit config

## Phase Details

### Phase 1: Backend Correctness
**Goal**: The Python backend is type-safe and fails loudly — no suppressed type errors, no silently swallowed API failures, no accidental zero-coordinate defaults.
**Depends on**: Nothing (first phase)
**Requirements**: TYPES-01, TYPES-02, ERR-01, ERR-02, ERR-03
**Success Criteria** (what must be TRUE):
  1. `mypy` or `pyright` (or `ruff check`) runs clean on `http.py` and `feature_info.py` with no `# type: ignore` suppressions present
  2. Querying a naturvern, grunnforurensning, or kulturminner ArcGIS endpoint that returns an API-level error raises a typed exception (visible in backend logs), not a silent empty list
  3. Calling `GET /api/v1/properties/areas` without `ost` or `nord` params returns HTTP 422, not a result computed from 0.0 coordinates
  4. All router endpoints (`addresses.py`, `properties.py`, `feature_info.py`) return a consistent JSON error shape for `ApiError` and timeout conditions, not unhandled 500 traces
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Fix _fetch_with_retry @overload (TYPES-01) and _safe[T] generic (TYPES-02); add [tool.mypy] to pyproject.toml
- [ ] 01-02-PLAN.md — Raise ApiError on ArcGIS API errors in naturvern, grunnforurensning, kulturminner clients (ERR-01)
- [ ] 01-03-PLAN.md — Add consistent try/except wrappers to all router endpoints; fix 0.0 coordinate default in search_properties (ERR-02, ERR-03)

### Phase 2: Frontend Architecture Split
**Goal**: `MapSearchControl.tsx` and `MapPageView.tsx` each respect the 6-layer feature architecture — HTTP logic is in `api/`, state logic is in `hooks/`, rendering is in `ui/`.
**Depends on**: Phase 1
**Requirements**: ARCH-01, ARCH-02
**Success Criteria** (what must be TRUE):
  1. `MapSearchControl.tsx` contains no `fetch` calls or HTTP logic — address search and matrikkel lookup each live in their own hook; HTTP calls live in `api/addressSearch.ts`
  2. `MapPageView.tsx` contains no inline component definitions — `StatusDot` is a separate file in `ui/`, `FeatureInfoTabs` is a separate file in `ui/`, store subscription logic is extracted to `hooks/usePropertySelection.ts`
  3. `tsc --noEmit` and `npm run build` pass cleanly after the split
**Plans**: TBD

### Phase 3: Frontend Polish & Zod Validation
**Goal**: The frontend tab components have explicit, consistent type annotations; `MiljoTab` status derivation is DRY; all API responses are validated at the network boundary with Zod before entering domain functions.
**Depends on**: Phase 2
**Requirements**: ARCH-03, DRY-01, TYPES-03
**Success Criteria** (what must be TRUE):
  1. All helper functions in `RisikoTab`, `MiljoTab`, and `GenereltTab` have explicit return types (`RiskStatus` or `string`) — no inferred `any` or missing annotations
  2. `MiljoTab.tsx` contains a single `deriveStatus()` utility (or equivalent) replacing the 6 near-identical inline helpers — the repeated pattern appears exactly once
  3. Zod schemas exist for all 3 API boundaries (`/api/v1/feature-info`, property search, address search); raw `as SomeType` casts at those boundaries are removed
  4. `tsc --noEmit` and `npm run build` pass cleanly; Zod parse errors surface visibly (console or UI) rather than crashing silently
**Plans**: TBD

### Phase 4: Docker & Deployment Readiness
**Goal**: A developer (or Sweco team member) can clone the repo, copy `.env.example`, run `docker compose up`, and get a working stack — with all configuration driven by env vars and no hardcoded service literals.
**Depends on**: Phase 3
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts both services successfully; the frontend is reachable at `localhost:5173` (or configured port) and proxies API calls to the backend
  2. `backend/Dockerfile` produces a runnable image: non-root user, `GET /health` returns 200, uvicorn starts on the configured port
  3. `frontend/Dockerfile` produces an nginx image that serves the Vite build with correct MIME types and SPA fallback (deep-link routes return `index.html`)
  4. All CORS origins, backend service URLs, and ports are read from environment variables — no string literals are hardcoded in `config.py`, routers, or clients
  5. `.gitignore` at repo root covers `.env`, `.env.local`, `__pycache__/`, `*.pyc`, `dist/`, `.venv/`, `.DS_Store`; `frontend/.env.example` documents all `VITE_*` vars
**Plans**: TBD

## Progress

**Execution order:** 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Correctness | 0/3 | Not started | - |
| 2. Frontend Architecture Split | 0/TBD | Not started | - |
| 3. Frontend Polish & Zod Validation | 0/TBD | Not started | - |
| 4. Docker & Deployment Readiness | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-01*
*Milestone: v1.1 — Code Quality & Deployment Readiness*
