# AnalyticalMapServices

## What This Is

A geospatial property analysis tool for Norwegian real estate. Users click a map or search an address to get an automated regulatory compliance report across climate risk (flood, landslide), environmental risk (radon, noise, contamination, cultural heritage, nature reserves), and land-use planning data (kommuneplan, reguleringsplan). Built as a monorepo: React 19 + TypeScript frontend, FastAPI + Python 3.12 backend.

## Core Value

Give planners and property analysts an instant, multi-source risk and regulatory snapshot for any Norwegian property — replacing hours of manual WMS lookups.

## Requirements

### Validated

- ✓ Map view with click-to-query and address/matrikkel search — v1.0 port
- ✓ 13+ WMS + ArcGIS data sources aggregated server-side — v1.0 port
- ✓ Traffic-light tab statuses (Klima, Risiko, Miljø, Generelt) — v1.0 port
- ✓ Multi-property selection, side panel, batch pre-fetch — v1.0 port
- ✓ Backend caching (1h TTL, 100m grid key) — v1.0 port
- ✓ Dark/light theme, Auvora design system — v1.0 port

### Active

See REQUIREMENTS.md for v1.1 milestone scope.

### Out of Scope

- Sweco SSO / Azure AD authentication — future milestone (Sweco port)
- Sweco white-label branding — future milestone (Sweco port)
- Mobile app — web-first, not planned
- Real-time collaboration — not needed
- User accounts / saved searches — not in v1

## Context

- **Monorepo**: `frontend/` (React 19, Vite v7, Tailwind CSS v4, Zustand 5, React Router v7) + `backend/` (FastAPI 0.115+, uv, Python 3.12, httpx, cachetools)
- **Architecture**: 6-layer map feature (config → api → domain → hooks → stores → ui → PageView). Backend: routers → services → clients → domain/parsers.
- **Portability goal**: Must be runnable by Sweco via Docker Compose. App may need to be ported to Sweco's internal repo with SSO and branding changes in a future milestone.
- **Current debt**: Large components (MapSearchControl 541 lines, MapPageView 498 lines), type-ignore suppressions in http.py, silent error handling in ArcGIS clients, no runtime API validation, no Docker setup.

## Constraints

- **Tech stack**: No stack changes — extend existing patterns only.
- **Backend**: uv for dependency management. No pip/poetry.
- **Frontend**: npm, Vite v7, no webpack. No new state management libs.
- **Portability**: All configuration (API URLs, CORS origins, ports) must be env-var driven — hardcoded values are deployment blockers.
- **Sweco porting**: Architecture must allow easy auth layer insertion and env-var brand config without core rewrites.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Server-side WMS aggregation (backend) | Avoids CORS, caching, parallelism on client | ✓ Good |
| Feature-based module structure (frontend) | Enforces layer boundaries, testable | ✓ Good |
| Docker Compose for deployment | Portable, self-hosted, Sweco-compatible | — Pending |
| Zod for API response validation | Type safety at runtime boundary, catches schema drift | — Pending |

---
*Last updated: 2026-03-01 — Milestone v1.1 started (Code Quality & Deployment Readiness)*
