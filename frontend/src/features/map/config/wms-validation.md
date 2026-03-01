# WMS Layer Validation — Phase 4.4

Tested: 2026-02-27 from developer workstation via `GetCapabilities` requests.

## Summary

| # | Layer | Endpoint alive? | Layer name correct? | Queryable? | GetFeatureInfo formats | Notes |
|---|-------|:-:|:-:|:-:|---|---|
| 1 | **Matrikkelkart** (Geonorge) | ✅ | ✅ `matrikkelkart` | ✅ (1) | `text/plain`, `application/vnd.ogc.gml` | All sub-layers queryable. WMS 1.3.0. |
| 2 | **Planavgrensning** (Geonorge) | ❌ | — | — | — | Server-side config error: `msLoadMap(): Unable to access file`. Endpoint non-functional. **Blocked.** |
| 3 | **Radon** (NGU) | ✅ | ✅ `Radon_aktsomhet` | ✅ (1) | `text/html`, `application/vnd.ogc.gml`, `text/plain` | WMS 1.1.0. Overview layer (`Radon_aktsomhet_oversikt`) is NOT queryable — only `Radon_aktsomhet` is queryable=1. |
| 4 | **Flomsone 50 års** (NVE) | ✅ | ✅ `Flomsone_50arsflom` | ✅ (1) | `application/geo+json`, `text/html`, `text/plain`, `text/xml`, `application/vnd.ogc.wms_xml`, `application/vnd.esri.wms_featureinfo_xml`, `application/vnd.esri.wms_raw_xml` | WMS 1.3.0. Also available: 10/20/100/200/500/1000 år + 200_klima. |
| 5 | **Skredfaresone 100 års** (NVE) | ✅ | ✅ `Skredsoner_100` | ✅ (1) | Same 7 formats as Flomsone | Also available: 1000 / 5000 + Skredanalyseomraade. |
| 6 | **Kvikkleire** (NVE) | ✅ | ✅ `KvikkleireskredAktsomhet` | ✅ (1) | Same 7 formats as Flomsone | Also has `KvikkleireskredAktsomhetDekning` layer. |

## Recommended GetFeatureInfo format per source

| Source | Preferred format | Rationale |
|--------|-----------------|-----------|
| Geonorge (Matrikkelkart) | `text/plain` | No JSON available; plain text is simplest to parse. GML is over-engineered for our needs. |
| NGU (Radon) | `text/plain` | Same reasoning. HTML is poorly structured for automated parsing. |
| NVE (Flom/Skred/Kvikkleire) | `application/geo+json` | Structured JSON → easy to map to domain types. Preferred over Esri-proprietary formats. |

## Planavgrensning resolution

The Geonorge Planavgrensning WMS (`wms.planomraade`) returns a MapServer error:

```
msLoadMap(): Unable to access file. (/etc/mapserver/maps/planomraade/mapfiles/planomraade.map)
```

**Options:**
1. **Wait for Geonorge to fix** — monitor periodically.
2. **Switch to alternative** — Geonorge provides plan data via WFS (`https://wfs.geonorge.no/skwms1/wfs.planomraade`), but that's a different protocol. The tiles won't render as a WMS overlay without a proxy.
3. **Remove from default layers** — mark `checkedByDefault: false` and add a note. Currently it's already unchecked by default.

**Decision:** Keep the layer in config for when the service recovers. It is already unchecked by default so it won't cause visual errors.

## Available NVE Flomsone layers (for Phase 5)

| Layer name | Description |
|-----------|-------------|
| `Flomsone_10arsflom` | 10-year return flood zone |
| `Flomsone_20arsflom` | 20-year return flood zone |
| `Flomsone_50arsflom` | 50-year return flood zone (currently configured) |
| `Flomsone_100arsflom` | 100-year return flood zone |
| `Flomsone_200arsflom` | 200-year return flood zone |
| `Flomsone_500arsflom` | 500-year return flood zone |
| `Flomsone_1000arsflom` | 1000-year return flood zone |
| `Flomsone_200arsflom_klima` | 200-year with climate adjustment |
| `FlomsoneAnalyseomraade` | Analysis area coverage |

## Available NVE Skredfaresone layers (for Phase 5)

| Layer name | Description |
|-----------|-------------|
| `Skredsoner_100` | 100-year return landslide zone (currently configured) |
| `Skredsoner_1000` | 1000-year return landslide zone |
| `Skredsoner_5000` | 5000-year return landslide zone |
| `Skredanalyseomraade` | Analysis area coverage |

## Phase 5 implications

- **5 of 6 layers** support GetFeatureInfo and can provide structured data.
- NVE layers support `application/geo+json` — ideal for automated processing.
- Radon + Matrikkelkart only offer `text/plain` and GML — will need text parsing.
- Planavgrensning is blocked — plan data may need an alternative source (WFS or dedicated API).
