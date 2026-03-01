---
title: "ADR-005: SafeParse Error Boundary Pattern"
status: Accepted
project: NO-Ask
author: NOASOL
date: 2026-02-27
---

## Status

Accepted

## Context

The map service parses responses from 13 external APIs in 15+ parser functions. These APIs:

- Return different formats (GML, GeoJSON, text/plain, ArcGIS JSON)
- May change response structure without notice
- Can return partial data, empty responses, or error pages
- Have different failure modes (timeout, 500, malformed XML, HTML error pages)

A single malformed response from one API should **not** crash the entire multi-source data fetch. If NGU Radon returns unexpected XML, the user should still see flood zone and noise data from other sources.

During Phase 5 testing, we observed that NGU occasionally returns HTML error pages (with `<html>` tags) instead of GML, causing XML parsing to throw. This motivated a systematic error isolation approach.

## Decision

We will implement a **`safeParse()` higher-order function** that wraps every parser:

```typescript
function safeParse<T>(
  parser: () => T,
  fallback: T,
  label: string
): T {
  try {
    return parser();
  } catch (error) {
    console.warn(`[safeParse] ${label} failed:`, error);
    return fallback;
  }
}
```

**Rules**:

1. Every parser function in `featureInfoParser.ts` is called via `safeParse()` with an appropriate `null` fallback
2. The `label` parameter identifies which parser failed (for debugging)
3. Failures are logged as warnings, not errors — they're expected operational conditions
4. The assembler function (`parseRisikoData`, etc.) composes individual `safeParse`-wrapped parsers
5. UI components always handle `null` data with "Ingen data tilgjengelig" indicators

This ensures **partial success** — if 10 of 13 APIs respond correctly, the user sees data from those 10.

## Consequences

### Positive

- **Fault isolation**: One broken API never crashes the entire data fetch
- **Graceful degradation**: Users see available data + clear "no data" indicators for failed sources
- **Debug-friendly**: Warnings in console identify exactly which parser failed and why
- **Zero user-facing errors**: No uncaught exceptions from parsing — all handled at the boundary

### Negative

- **Silent failures**: A parser bug could hide behind `safeParse` for a long time — mitigation: console warnings are visible during development; add telemetry when backend is introduced
- **Null propagation**: Every consumer must handle `null` — mitigation: TypeScript's strict null checks enforce this at compile time

### Neutral

- The pattern is intentionally simple (try/catch + fallback) rather than using a Result monad or Either type — keeps code readable for the team

## Alternatives Considered

### Alternative A: Per-source try/catch in the hook

Wrap each API call in the hook layer. Rejected because it mixes error handling with orchestration logic and doesn't protect against parser-level failures.

### Alternative B: Result<T, E> type

Return `{ ok: true, value: T } | { ok: false, error: E }` from each parser. Rejected as over-engineering for this use case — the consumers only need data-or-null, not typed error details.

### Alternative C: Global error boundary (React)

Use React error boundaries to catch rendering errors. Rejected because parsing happens before rendering — the error occurs in the hook/domain layer, not in JSX.
