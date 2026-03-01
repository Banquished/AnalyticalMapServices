# Requirements: AnalyticalMapServices

**Defined:** 2026-03-01
**Milestone:** v1.1 — Code Quality & Deployment Readiness
**Core Value:** Instant multi-source risk and regulatory snapshot for any Norwegian property.

## v1.1 Requirements

### Type Safety

- [ ] **TYPES-01**: Backend `http.py` — `_fetch_with_retry` refactored with `@overload` so callers no longer need `# type: ignore` suppressions
- [ ] **TYPES-02**: Backend `feature_info.py` — `_safe[T]` generic properly binds return type; `_rest()` type mismatch resolved without suppression
- [ ] **TYPES-03**: Frontend — Zod schemas created and applied at all 3 API boundaries (`/api/v1/feature-info`, property search, address search); raw `as SomeType` casts removed

### Architecture

- [ ] **ARCH-01**: `MapSearchControl.tsx` split along layer boundaries: HTTP calls extracted to `api/addressSearch.ts`; typeahead logic extracted to `hooks/useAddressTypeahead.ts`; matrikkel lookup extracted to `hooks/useMatrikkelSearch.ts`; UI component reduced to rendering only
- [ ] **ARCH-02**: `MapPageView.tsx` refactored: `StatusDot` moved to `ui/StatusDot.tsx`; store subscription boilerplate extracted to `hooks/usePropertySelection.ts`; tab rendering block extracted to `ui/FeatureInfoTabs.tsx`
- [ ] **ARCH-03**: All helper functions in tab components (`RisikoTab`, `MiljoTab`, `GenereltTab`) have explicit return types matching `RiskStatus` or `string`

### Error Handling

- [ ] **ERR-01**: ArcGIS REST clients (`naturvern.py`, `grunnforurensning.py`, `kulturminner.py`) raise a typed error on API-level errors instead of silently returning `[]`
- [ ] **ERR-02**: All FastAPI router endpoints (`addresses.py`, `properties.py`, `feature_info.py`) consistently catch `ApiError` and `httpx.TimeoutException`, converting them to explicit `HTTPException` responses
- [ ] **ERR-03**: `properties.py` `search_properties` endpoint — `ost` and `nord` query params are required (no silent 0.0 default); missing params return HTTP 422

### DRY

- [ ] **DRY-01**: `MiljoTab.tsx` — 6 near-identical status helper functions consolidated into a shared `deriveStatus()` utility (or equivalent); no repeated status-derivation boilerplate

### Deployment

- [ ] **DEPLOY-01**: `backend/Dockerfile` created — multi-stage build, Python 3.12, uv for deps, non-root user, uvicorn entry point, health check endpoint
- [ ] **DEPLOY-02**: `frontend/Dockerfile` created — Node build stage (npm ci + vite build), nginx static serve stage, correct MIME types and SPA fallback
- [ ] **DEPLOY-03**: `docker-compose.yml` at repo root — backend + frontend services, env var passthrough, correct port mapping, volume for backend `.env`
- [ ] **DEPLOY-04**: `frontend/.env.example` created — documents all frontend env vars (`VITE_API_PROXY_TARGET` or equivalent)
- [ ] **DEPLOY-05**: Root `.gitignore` updated — adds `.env`, `.env.local`, `.DS_Store`, `__pycache__/`, `*.pyc`, `dist/`, `.venv/`
- [ ] **DEPLOY-06**: Backend config audit — all hardcoded CORS origins, ports, and service URLs moved to `config.py` env vars; no literals scattered in routers or clients

## v2 Requirements

*(Deferred — Sweco port milestone)*

- **SWECO-01**: Azure AD / Entra ID SSO authentication layer
- **SWECO-02**: White-label branding (Sweco design system replacing Auvora)
- **SWECO-03**: WMS/ArcGIS endpoint configuration via env vars (Sweco proxy support)
- **SWECO-04**: Role-based access control (admin vs analyst)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / saved properties | Not in product vision for v1 |
| Mobile app | Web-first; not planned |
| Real-time collaboration | Not needed for analyst workflow |
| Backend Pydantic response validation schemas | FastAPI already enforces request schemas; response validation is a v2 concern |
| Unit tests for all fixed code | Testing milestone is separate; DRY/architecture improvements should be self-evidently correct |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPES-01 | Phase 1 | Pending |
| TYPES-02 | Phase 1 | Pending |
| ERR-01 | Phase 1 | Pending |
| ERR-02 | Phase 1 | Pending |
| ERR-03 | Phase 1 | Pending |
| ARCH-01 | Phase 2 | Pending |
| ARCH-02 | Phase 2 | Pending |
| ARCH-03 | Phase 3 | Pending |
| DRY-01 | Phase 3 | Pending |
| TYPES-03 | Phase 3 | Pending |
| DEPLOY-01 | Phase 4 | Pending |
| DEPLOY-02 | Phase 4 | Pending |
| DEPLOY-03 | Phase 4 | Pending |
| DEPLOY-04 | Phase 4 | Pending |
| DEPLOY-05 | Phase 4 | Pending |
| DEPLOY-06 | Phase 4 | Pending |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 — traceability populated by roadmapper*
