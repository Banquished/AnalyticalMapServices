---
title: "ADR-004: ArcGIS REST API for Riksantikvaren and Miljødirektoratet"
status: Accepted
project: NO-Ask
author: NOASOL
date: 2026-02-27
---

## Status

Accepted

## Context

Two key data sources — Riksantikvaren (cultural heritage) and Miljødirektoratet (road noise) — do not expose standard OGC WMS `GetFeatureInfo` endpoints. Instead, they run **Esri ArcGIS Server** with REST API query endpoints.

**Riksantikvaren** (Kulturminner):

- URL: `https://gis3.ra.no/arcgis/rest/services/Distribusjon/Kulturminner/MapServer/5`
- Supports spatial queries with `geometry`, `geometryType: esriGeometryPoint`, `spatialRel: esriSpatialRelIntersects`
- Returns JSON with feature attributes (name, type, protection status, dating)
- Requires a buffer distance (~200m) because point-exact queries miss nearby features

**Miljødirektoratet** (Støy veg — road noise):

- URL: `https://kart3.miljodirektoratet.no/arcgis/rest/services/stoy/stoykart_strategisk_veg/MapServer/5`
- Supports the same ArcGIS spatial query pattern
- Returns noise category and measurement period data

Meanwhile, other noise sources (jernbane/jernbane, militær/forsvaret) use standard WMS and fit the config-driven pattern from ADR-005.

## Decision

We will create **dedicated API client functions** for ArcGIS REST sources, separate from the config-driven WMS client:

- `api/kulturminnerClient.ts` — `queryKulturminner(lat, lng)` with 200m radius
- `api/stoySonerClient.ts` — `queryStoyVeg(lat, lng)` with point query

These clients:

1. Use the same `fetchJsonWithRetry` utility as WMS clients
2. Return typed response objects matching ArcGIS REST JSON structure
3. Are parsed by dedicated domain parsers (`parseKulturminner()`, `parseStoyVeg()`)
4. Are called alongside WMS queries in `fetchAllFeatureInfo()` via `Promise.all()`

Both REST queries run **in parallel** with the 11 WMS queries — no sequential blocking.

## Consequences

### Positive

- **Correct protocol**: ArcGIS REST is queried natively instead of trying to force it through WMS
- **Rich data**: ArcGIS REST returns full JSON feature attributes, more reliable than WMS text/plain
- **Spatial buffers**: Radius-based queries (200m for kulturminner) catch nearby features that point-exact WMS queries would miss
- **Backend-portable**: `fetchJsonWithRetry` + URL construction translates directly to Python `httpx` calls

### Negative

- **Two query patterns**: WMS (config-driven) + ArcGIS REST (per-client) creates some inconsistency — mitigation: both produce typed domain objects consumed identically by hooks
- **Buffer radius is arbitrary**: 200m for kulturminner may be too wide or narrow in some areas — mitigation: could be made configurable later

### Neutral

- If Riksantikvaren or Miljødirektoratet add WMS GetFeatureInfo support, we could migrate, but the REST API is more capable and there's no incentive to switch

## Alternatives Considered

### Alternative A: Use WMS GetMap + image analysis

Query the ArcGIS server's WMS endpoint and analyze the returned image for coloured pixels. Rejected — unreliable, lossy, and doesn't provide attribute data.

### Alternative B: Esri JS SDK

Use Esri's JavaScript SDK for official ArcGIS integration. Rejected — adds a large dependency (several MB), SDK-specific abstractions, and creates vendor lock-in. Raw REST queries are simpler and portable.
