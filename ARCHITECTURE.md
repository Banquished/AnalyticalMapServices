# Architecture — AnalyticalMapServices

## Overview

Monorepo with two independently deployable applications:

```
AnalyticalMapServices/
├── frontend/   — React 19 + Vite 7 + TypeScript SPA
└── backend/    — Python 3.12 + FastAPI (uv project)
```

The frontend proxies all `/api` calls to the backend during development (Vite proxy → `:8000`).
In production, the backend is deployed separately and the frontend points to it via environment variable.

---

## Frontend

### Stack

| Concern | Tool |
|---------|------|
| Build | Vite 7 + `@vitejs/plugin-react` |
| Framework | React 19 |
| Language | TypeScript (strict mode) |
| Routing | React Router v7 (`createBrowserRouter`) |
| State | Zustand 5 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` — no config file |
| Map | Leaflet + react-leaflet |
| Package manager | npm |

### Module structure

```
src/
├── features/           — one directory per domain feature
│   └── map/            — the primary feature (see below)
├── shared/             — code used by 2+ features only
│   ├── ui/             — shared React components
│   └── domain/         — shared pure types and utilities
├── layouts/            — AppShell (Sidebar + Header + main)
├── pages/              — thin route leaves (Home, About, Changelog, Settings)
├── stores/             — global app-level Zustand stores (theme, sidebar)
├── router.tsx          — route tree, no logic
└── main.tsx            — entry: initTheme(), RouterProvider, ToastContainer
```

### Feature anatomy

Every feature must follow this strict 6-layer structure (innermost layers may not import outer layers):

```
features/<name>/
├── config/         — 0. pure data: constants, endpoint definitions, options
├── api/            — 1. HTTP client wrappers; no React, no stores
├── domain/         — 2. pure TS types + parsers + business logic; no side effects
├── hooks/          — 3. React hooks; may call api/ and domain/; no UI assumptions
├── stores/         — 4. Zustand stores; may call api/; session or persisted state
├── ui/             — 5. React components; reads stores and hooks; no direct fetch
└── <Name>PageView.tsx — 6. composition root; mounts ui/ components
```

**Import direction**: `6 → 5 → 4 → 3 → 2 → 1 → 0`. No skipping layers upward.

### Map feature specifics

The `features/map/` feature implements:
- WMS GetFeatureInfo for 13+ Norwegian government map services
- ArcGIS REST queries for environmental risk data
- Address/property lookup via Kartverket + Geonorge
- Export (PNG screenshot via `leaflet-simple-map-screenshoter`)
- Coordinate systems: EPSG:4326 (WGS84) + EPSG:25833 (UTM33N) via proj4

Map layer categories:
- **Generelt**: kommuneplan, matrikkelkart
- **Miljø**: naturvernområder, grunnforurensning, kulturminner, støysoner
- **Eiendom**: property bounds, address lookup, geokoding

### Routing invariant

Route files (`router.tsx`, `pages/*.tsx`) must:
- Only read URL params and render a `*PageView.tsx`
- Never contain business logic, fetch calls, or stores

### Shared code policy

`shared/` is only allowed if:
1. Used by 2+ features, AND
2. Not coupled to a specific feature's state or UI

---

## Backend

### Stack

| Concern | Tool |
|---------|------|
| Framework | FastAPI 0.115+ |
| Runtime | Python 3.12 |
| Package manager | uv |
| HTTP client | httpx (async) |
| Cache | cachetools TTLCache (1h TTL, ~100m grid key) |

### Layout

```
backend/
└── src/app/
    ├── config.py       — AMS_ env prefix settings (pydantic-settings)
    ├── cache.py        — TTLCache wrapper
    ├── main.py         — FastAPI app + CORS + router registration
    ├── clients/        — async HTTP clients for external APIs
    ├── services/       — orchestration (parallel fetches, aggregation)
    ├── routers/        — thin FastAPI routers
    └── domain/         — pure Python types + parsers
```

### Invariants

- **Routers are thin**: they validate input, call a service, and return. No business logic.
- **Domain functions are pure**: no HTTP, no cache, no async. Input → output.
- **Services orchestrate**: call clients, apply caching, aggregate results.
- **Auth/isolation at boundaries**: enforced in routers, not scattered through services.
- **No stack traces to client**: all exceptions map to typed `HTTPException`.

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/feature-info` | `lat`, `lng` → 17 parallel WMS+ArcGIS queries |
| GET | `/api/v1/properties/areas` | Matrikkel area lookup |
| GET | `/api/v1/properties/geokoding` | Coordinate → address |
| GET | `/api/v1/addresses/search` | Text → address suggestions |
| GET | `/api/v1/addresses/reverse` | Coordinate → nearest address |

### Dev run

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

---

## API Contract (Frontend ↔ Backend)

- TypeScript types in `frontend/src/features/map/api/types.ts` must match the FastAPI response models.
- **Preferred**: generate types automatically with `openapi-typescript`:
  ```bash
  npx openapi-typescript http://localhost:8000/openapi.json -o frontend/src/api/schema.d.ts
  ```
- **Rule**: no hand-rolled TypeScript types that contradict the OpenAPI schema. Any drift is a bug.
- All API responses must be validated at the boundary (Zod or a typed guard) before passing to domain functions.

---

## Error Handling

| Layer | Rule |
|-------|------|
| domain/ | Throw typed `Error` subclasses. Never return `null`/`undefined` for errors. |
| api/ | Convert HTTP errors to domain errors or `Result<T, E>`. |
| hooks/ | `try/catch` async; surface typed errors to UI; never swallow. |
| ui/ | `ErrorBoundary` for render errors; display user-friendly message. |
| FastAPI routers | `raise HTTPException(status_code=..., detail=...)`. Never expose stack traces. |

---

## Design System

- **Auvora** design system in `frontend/src/style.css` — single source of truth.
- Dark-mode default; light via `data-theme="light"` on `<html>`.
- Color tokens in OKLCH; utility classes via Tailwind CSS v4.
- No external UI component library — all components hand-crafted in CSS classes.

---

## Testing

See `~/.claude/rules/testing.md` for global testing conventions.

- Frontend: Vitest + React Testing Library; focus on `domain/` (pure functions) and hooks.
- Backend: pytest; focus on `domain/` and `routers/` via `httpx.AsyncClient`.
- External HTTP calls mocked at the boundary (msw / respx / pytest-httpx).
