---
title: "ADR-002: Config-Driven WMS Integration Pattern"
status: Accepted
project: NO-Ask
author: NOASOL
date: 2026-02-26
---


## Status

Accepted

## Context

The map service queries 11 WMS endpoints (and growing) using the OGC `GetFeatureInfo` protocol. Each endpoint has different:

- **Base URLs**: NVE, NGU, Geonorge, Bane NOR, Forsvaret
- **WMS versions**: 1.1.0 (NGU) vs. 1.3.0 (NVE, Geonorge)
- **Response formats**: `application/geo+json`, `application/vnd.ogc.gml`, `text/plain`
- **Layer names**: varying conventions
- **CRS axis ordering**: WMS 1.1.0 uses `lon,lat` (BBOX), WMS 1.3.0 uses `lat,lon` for EPSG:4326

Hardcoding these differences across multiple API call sites would create duplication and make adding new endpoints error-prone.

## Decision

We will use a **config-driven pattern** where all WMS endpoints are defined as data objects in `config/featureInfoEndpoints.ts`, and a single generic client (`api/wmsFeatureInfoClient.ts`) builds `GetFeatureInfo` URLs from these configs.

Each endpoint config specifies:

```typescript
type FeatureInfoEndpoint = {
  key: string;              // e.g. "flom50"
  url: string;              // WMS base URL
  layers: string;           // WMS LAYERS parameter
  version: "1.1.0" | "1.3.0";  // determines BBOX axis order
  infoFormat: string;       // INFO_FORMAT
  featureCount?: number;    // FEATURE_COUNT (default 1)
};
```

The generic client:

1. Projects `lat/lng` to pixel coordinates in a virtual 101×101 map tile
2. Handles CRS axis ordering based on WMS version
3. Appends all required WMS parameters
4. Returns the raw response text for the caller's parser

## Consequences

### Positive

- **Adding a new WMS source = 1 config object + 1 parser function** — no HTTP client changes needed
- **Version/axis differences handled once** — WMS 1.1.0 vs. 1.3.0 BBOX ordering in one place
- **Testable**: Config objects are plain data; client is a single pure function
- **Backend-portable**: Config translates directly to Python dicts; client to a `requests`-based utility

### Negative

- **Not all sources are WMS**: Riksantikvaren and Miljødirektoratet use ArcGIS REST — these need separate clients (see ADR-007)
- **Config doesn't capture auth**: If a future endpoint requires API keys, the config schema needs extending — mitigation: add optional `headers` field when needed

### Neutral

- The 101×101 pixel grid for GetFeatureInfo is a pragmatic choice (large enough for accuracy, small enough for fast responses)

## Alternatives Considered

### Alternative A: Per-endpoint API client functions

Each WMS endpoint gets its own `queryFlom50(lat, lng)` function with hardcoded URL/params. Rejected because this duplicates the WMS protocol logic 11+ times and makes version/axis handling inconsistent.

### Alternative B: Generic WMS library (e.g., `ol/source/TileWMS`)

Use OpenLayers' WMS utilities. Rejected because we use Leaflet (not OpenLayers), and adding OL as a dependency just for URL building is excessive. Our client is ~40 lines.
