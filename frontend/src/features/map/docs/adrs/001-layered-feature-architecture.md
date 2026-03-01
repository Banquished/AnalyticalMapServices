---
title: "ADR-001: Layered Feature Architecture for Map Service"
status: Accepted
project: NO-Ask
author: NOASOL
date: 2026-02-25
---

## Status

Accepted

## Context

The map service is the largest feature in NO-Ask, integrating 13+ external API endpoints, multiple WMS protocols, complex state management (multi-property selection, caching, batch pre-fetching), and a rich UI with 5 tabs, resizable panels, and Leaflet map interactions.

Without clear boundaries, this complexity would create a tightly coupled monolith where API response handling, business logic, React state, and UI rendering are all interleaved — making it impossible to:

- Extract the API/domain layers to a Python backend later
- Test parsers in isolation
- Swap the UI framework (e.g., for a mobile app)
- Onboard new developers quickly

The project also has a concrete future requirement: the API clients and domain logic must be 1:1 translatable to Python/FastAPI when a backend proxy is introduced for API key protection, caching, and AI integration.

## Decision

We will organize the map feature into **5 strict layers** with unidirectional imports:

```
src/features/map/
├── api/          → Pure TS HTTP clients. No React, no browser APIs beyond fetch.
├── config/       → Endpoint definitions, WMS layer configs. Plain data objects.
├── domain/       → Parsers, types, business logic. No React, no fetch, no side effects.
├── hooks/        → React hooks. Thin wrappers that compose api/ and domain/ layers.
├── stores/       → Zustand stores. State containers only, no business logic.
├── ui/           → React components. Rendering only, no direct API calls.
└── MapPageView   → Page orchestrator. Wires hooks → UI, manages layout.
```

**Import rules**:

| Layer | Can import from | Cannot import from |
|-------|----------------|-------------------|
| `api/` | `config/`, external libs | `domain/`, `hooks/`, `stores/`, `ui/` |
| `config/` | nothing | everything |
| `domain/` | `config/` (types only) | `api/`, `hooks/`, `stores/`, `ui/` |
| `hooks/` | `api/`, `domain/`, `stores/`, `config/` | `ui/` |
| `stores/` | `domain/` (types only) | `api/`, `hooks/`, `ui/` |
| `ui/` | `domain/` (types only) | `api/`, `hooks/`, `stores/` |

## Consequences

### Positive

- **Backend portability**: `api/` and `domain/` have zero React dependencies — can be transliterated to Python line-by-line
- **Testable parsers**: All 15+ parsers in `domain/featureInfoParser.ts` are pure functions operating on strings/objects
- **Separation of concerns**: Adding a new data source follows a clear path: endpoint config → API client → parser → hook integration → UI tab
- **Feature encapsulation**: The entire `features/map/` folder can be lifted into another React app (only depends on `@shared/` utilities)

### Negative

- **More files**: 40+ files vs. what could be 10–15 in a flat structure — mitigation: clear naming conventions and consistent directory structure
- **Import indirection**: Hooks wrap API calls that could be called directly from components — mitigation: this indirection is the entire point (enables caching, batching, error boundaries)

### Neutral

- The `map.css` file is monolithic (~1,850 lines) rather than split per-component — acceptable trade-off to avoid CSS import order issues
