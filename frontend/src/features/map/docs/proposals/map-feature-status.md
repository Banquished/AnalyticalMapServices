# Map Feature — Continuation Prompt

> **Purpose**: Hand-off document for picking up the map service in a new session.  
> **Repo**: `NO-Ask` (`C:\Users\NOASOL\Documents\DevOps\NO-Ask`)  
> **Date created**: 2026-02-25  
> **Last updated**: 2026-02-27 (Phase 6 in progress — Løsmasser, Berggrunn, Kulturminner, Støysoner implemented; 5-tab layout; batch fixes)  
> **Related docs**: [Proposal](../proposals/map-service-proposal.md) · [TAD](../tads/map-service-tad.md) · ADRs [004](../adrs/004-layered-feature-architecture.md)–[009](../adrs/009-five-tab-panel-layout.md)

---

## 1. Session Summary — What Was Built

### Goal

Build a **property map service** (`/map` route) using React Leaflet that lets users look up Norwegian properties by address, matrikkel number (`kommune/gnr/bnr`), or map click. The service queries two public APIs — **Kartverket Eiendom v1** (property boundaries/polygons) and **Geonorge Adresser v1** (address search/geocoding) — and renders properties as coloured polygons on the map.

### Architecture

The feature follows the repo's **layered, framework-agnostic** pattern:

```
src/features/map/
├── api/                         # Pure TS HTTP clients (no React)
│   ├── types.ts                 # Mirror of upstream OpenAPI response shapes
│   ├── kartverketClient.ts      # Kartverket Eiendom v1 client
│   └── geonorgeClient.ts        # Geonorge Adresser v1 client
├── domain/                      # Business logic (no React, no framework)
│   ├── types.ts                 # App-level models: Property, Address, SearchQuery, etc.
│   └── propertyLookup.ts        # Orchestrates 3 lookup flows (address / matrikkel / click)
├── hooks/                       # React hooks — thin wrappers over domain layer
│   ├── usePropertySearch.ts     # General search hook (loading / error / result state)
│   └── useMapInteraction.ts     # Map-click hook (reuses usePropertySearch internally)
├── ui/                          # React components
│   ├── MapView.tsx              # Leaflet map: polygons, FA marker, fly-to, click handler
│   ├── SearchBar.tsx            # Address / matrikkel mode toggle with inputs
│   └── PropertyInfoPanel.tsx    # Property & address detail cards
└── MapPageView.tsx              # Page composition — wires hooks, derives polygons, toasts
```

### What Works

| Capability | Status | Notes |
|---|---|---|
| **3 search flows** | ✅ Working | Address → Geonorge → Kartverket polygons; Matrikkel → Kartverket /geokoding?omrade=true; Map click → Kartverket /punkt/omrader |
| **Polygon rendering** | ✅ Working | Each selected property gets one colour from the 6-colour Sweco palette (cycled by list position). Sections/teiger share the colour. |
| **FA divIcon marker** | ✅ Working | Address marker uses FontAwesome, zero CDN dependency |
| **Fly-to animation** | ✅ Working | Smoothly flies to first property centroid, guards against (0,0) |
| **Dark/light popup CSS** | ✅ Working | Injected Sweco-themed overrides for `.leaflet-popup-*`, zoom controls, tooltips |
| **Toast notifications** | ✅ Extracted to `src/shared/ui/toast/` | App-wide Zustand store + Sweco-styled container mounted in Root layout. Outlined stroke-based SVG icons matching design guide. |
| **Error toasts** | ✅ Working | 422/404 → friendly messages; empty results → attention toast |
| **Route registered** | ✅ `/map`, order 5 | Sidebar icon: `fa-regular fa-map-location-dot` |
| **Full-viewport map** | ✅ Working | `fullWidth` route flag removes `max-w-7xl` wrapper; map fills all space below header |
| **Floating search control** | ✅ Working | Pill-shaped Leaflet control (`topleft`) with address/matrikkel mode toggle, helper tooltip on hover, submit arrow |
| **Resizable right side-panel** | ✅ Working | `SidePanel` component with pointer-drag resize, dark/light aware, green accent on resize handle |
| **Panel toggle control** | ✅ Working | Standalone `»`/`«` button outside map container, always visible at z-1001 |
| **Multi-property selection** | ✅ Working | Accumulates properties on click/search. Zustand v5 persist store (`propertySelection.store.ts`) with project-scoped selections, survives page refresh |
| **Property table** | ✅ Working | 5 columns: Eiendom (colour chip, clickable to highlight), Adresse, Gnr/Bnr, Fnr, Actions (↑↓🗑). "Fjern alle" footer button. Row highlight + polygon highlight sync |
| **Rich popup card** | ✅ Working | `PropertyPopupContent` component with colour swatch, address, postnr, kommune, gnr/bnr, fnr, avstand, koordinater. Custom close button (neutral grey, 24px) |
| **Z-index architecture** | ✅ Working | `<main>` has `relative z-0` stacking context; map elements (z-999/1000/1001) trapped inside; header at z-20 always wins |
| **Dark mode polish** | ✅ Working | All map chrome (popup, tooltip, zoom controls, side panel, table, search bar) adapts to both themes |
| **WMS layer controls** | ✅ Working | 8 toggleable WMS overlays (Matrikkelkart, Radon, Flomsone 50/100/200, Skredfaresone, Kvikkleire) + Farget eiendom polygon layer via `LayersControl` (topright). Sweco-styled checkboxes. 32×32px toggle. |
| **Map screenshot** | ✅ Working | `leaflet-simple-map-screenshoter` (bottomleft) with `dom-to-image-more`. Base64 stored in Zustand (persisted). Preview in SidePanel preFooter with "Fjern kartutsnitt" action. |
| **Export hook** | ✅ Working | `useMapExport()` hook exposes `selected`, `screenshotBase64`, `getExportData()`, `clearScreenshot()` for consuming apps. |
| **FlyTo on load only** | ✅ Working | Map flies to stored properties on page load but not on every click/search (prevents disorienting animations). |

### Known Gaps & Issues (remaining)

1. ~~**Layout is a basic grid**~~ — ✅ Resolved. Full-viewport via `fullWidth` route flag.
2. ~~**No property panel**~~ — ✅ Resolved. Resizable right side-panel.
3. ~~**Search bar is outside the map**~~ — ✅ Resolved. Floating Leaflet control.
4. ~~**Single-property result only**~~ — ✅ Resolved. Multi-select with persistent Zustand store.
5. ~~**No WMS layers**~~ — ✅ Resolved. 8 WMS overlays (Matrikkelkart, Radon, Flomsone 50/100/200, Skredfaresone, Kvikkleire) + Farget eiendom polygon layer via `LayersControl`. Planavgrensning removed (Geonorge server down).
6. ~~**No screenshot**~~ — ✅ Resolved. `leaflet-simple-map-screenshoter` with preview in SidePanel + persisted base64 in store.
7. ~~**No panel toggle button**~~ — ✅ Resolved. Standalone toggle at z-1001.
8. ~~**Toast SVG icons**~~ — ✅ Resolved. Outlined stroke-based SVGs matching Sweco design guide.
9. ~~**API edge cases**~~ — ✅ Resolved. MultiPolygon + Polygon both handled; legacy persisted data auto-detected.
10. ~~**Search UX needs refinement**~~ — ✅ Resolved. 1-click = 1-property with disambiguation picker.
11. ~~**Dead code**~~ — ✅ Resolved. `PanelToggleControl.tsx` deleted.
12. **Screenshot quality** — `dom-to-image-more` (used by the screenshoter plugin) has known tile-grid artefacts and minor polygon offset drift. Acceptable for preview thumbnails; may need server-side rendering for production-quality report exports.

---

## 2. Vision — What the Map Service Should Become

This service is intended to become a **standard reusable map component** for Sweco's internally-developed web applications. It replaces an older Bootstrap-based prototype that partially worked but lacked:

- Dark/light mode support
- Dual-API coverage (Kartverket + Geonorge together)
- Modern Tailwind/Sweco design system compliance
- Clean layered architecture for future Python/FastAPI backend extraction

### Reference UI (from the old Bootstrap app)

The target UX has these characteristics:

- **Full-size map** that fills all available viewport space (everything except the app's left sidebar and top header)
- **Search field overlay** floating on the map tile (top-left Leaflet control position), with a helper text like "Du kan søke på adresse (fantoftvegen 14P) eller gbnr (33/2 Rana)"
- **Resizable right side-panel** that slides in/out, contains a data table of selected properties
- **Panel toggle control** on the map (top-right) to show/hide the side-panel
- **LayersControl** for toggling WMS overlays (Matrikkelkart, Radon, etc.)
- **Multi-property selection**: click/search adds properties to a running list; each gets a unique colour-coded polygon and a row in the table
- **Screenshot** capability via `leaflet-simple-map-screenshoter` (bottom-left control)
- **Property table** with columns: Tiltakseiendom (colour chip), GeoNorgeAddress, Gnr, Bnr, Festenr, Slett (delete), Flytt (reorder)

---

## 3. Phased Plan

### Phase 1 — UX/UI Completion ✅ COMPLETED

Focus: Make the map page look and behave like the reference design **without** changing API logic.

**1.1 Full-viewport map layout** ✅

- Added `fullWidth?: boolean` to `AppRouteHandle` in `routeTypes.ts`.
- `Root.tsx` conditionally skips the `max-w-7xl` wrapper when `fullWidth: true`. `<main>` has `relative z-0` to create a stacking context.
- Map route sets `fullWidth: true`; map fills all available space below the header.

**1.2 Floating search control** ✅

- `MapSearchControl.tsx` — pill-shaped Leaflet control (`topleft`) using `createPortal` + `L.Control`.
- Address / matrikkel mode toggle chips. Helper tooltip on hover. Submit on Enter or arrow button.
- Dark/light mode aware with injected CSS.

**1.3 Resizable right side-panel** ✅

- `SidePanel.tsx` — absolutely positioned overlay (z-1000) with pointer-drag resize.
- Green accent `border-right` on resize handle (inside edge). Dark/light aware.
- Header with title + close button. Scrollable content area.
- Decision: Went with **Option A (right side-panel overlay)**. Bottom panel toggle can be added later.

**1.4 Panel toggle** ✅

- Standalone `»`/`«` button positioned outside the `MapContainer` at z-1001 (always visible).
- Old `PanelToggleControl.tsx` (Leaflet-based) is now dead code and can be cleaned up.

**1.5 Multi-property selection & table** ✅

- `propertySelection.store.ts` — Zustand v5 with `persist` middleware, project-scoped (`activeProjectId` → `projects` record).
- Properties accumulate on click/search. Each gets a cycled colour from the 6-colour Sweco palette.
- `PropertyTable.tsx` — 5 columns: Eiendom (colour chip + label, clickable to highlight polygon), Adresse, Gnr/Bnr, Fnr, Actions (↑ ↓ 🗑).
- "Fjern alle" footer button (`btn btn-sm btn-warning`) with icon + gap.
- Click Eiendom cell → highlights both table row (solid green bg, left accent, bold address) and map polygon (increased fillOpacity, weight, dashed stroke).

**1.6 Rich popup info card** ✅

- `PropertyPopupContent` component inside `<Popup closeButton={false}>` with custom close button.
- Shows: colour swatch + label, address, postnr, kommune, gnr/bnr, fnr, avstand, koordinater.
- Close button: 24px neutral grey circle with SVG X, 70% opacity, light + dark mode variants.
- Tip arrow properly clipped (`overflow: hidden`, `height: 13px`).

**1.7 Dark / light mode polish** ✅

- All map chrome (popup, tooltip, zoom controls, side panel, table, search bar, toggle button) adapts to both themes.
- Z-index architecture: `<main>` has `relative z-0` stacking context; map elements (z-999/1000/1001) trapped inside; header at z-20 always wins.

### Phase 2 — API & Data Robustness + Search UX Refinement ✅ COMPLETED

Focus: Make the dual-API integration bullet-proof and refine the click-to-select UX.

**2.0 CSS extraction — eliminate inline `<style>` injection** ✅

- Created `src/features/map/map.css` (~1060 lines) consolidating all map CSS.
- Removed runtime `document.createElement("style")` injection from MapView, SidePanel, PropertyTable, MapSearchControl.
- Deleted dead `PanelToggleControl.tsx` entirely.
- All `[data-theme="dark"]` selectors preserved and working.

**2.1 MultiPolygon handling** ✅

- `mapKartverketFeature()` now handles both `Polygon` and `MultiPolygon` geometry types.
- Polygon coordinates normalised to `number[][][][]` (MultiPolygon shape); legacy persisted `number[][][]` auto-detected at render time.
- `geoJsonToLeafletPositions()` in MapView auto-detects depth via `typeof geom[0]?.[0]?.[0]`.
- Domain type `Property.areaGeometry` accepts `number[][][][] | number[][][]` for backwards compatibility.

**2.2 Batch lookups** — Deferred (not needed: deduplication handled by selection store's matrikkel-key uniqueness).

**2.3 Search debounce & typeahead** ✅

- Address mode: 300ms debounced typeahead via Geonorge `/sok` with `fuzzy: true`, 50 results per page.
- Matrikkel mode: free-text typeahead parsing "kommunenavn gnr/bnr" format with progressive partial matching.
  - Queries Geonorge first; falls back to Kartverket `/geokoding` for properties without registered addresses (roads, undeveloped land).
  - Results deduplicated by matrikkel (kommunenummer + gnr/bnr).
- Arrow key navigation, Enter to select, Escape to dismiss. `data-has-suggestions` attribute suppresses tooltip when dropdown visible.

**2.4 Bounds fitting** ✅

- `fitBounds` computation includes polygon extents (not just centroid points) for tighter fitting.
- Auto-detects geometry depth for legacy data compatibility.

**2.5 Error resilience** ✅

- `fetchJsonWithRetry` utility in `api/fetchUtils.ts`: 10s timeout, 2 retries with exponential backoff.
- Classified `ApiError` with kinds: `validation`, `not-found`, `server`, `timeout`, `network`.
- Both `kartverketClient.ts` and `geonorgeClient.ts` use it with Norwegian user-facing error messages.

**2.6 Search / selection UX — "1 click = 1 property"** ✅

- Map click: auto-selects nearest property within 50m threshold. Shows `PropertyPickerPopover` for distant/ambiguous clicks or modifier-key clicks.
- Address search: matches returned address's matrikkel (kommunenummer/gnr/bnr) against Kartverket results → returns only the matching single property.
- Matrikkel search: free-text "kommunenavn gnr/bnr" format. Resolves municipality name → kommunenummer via Geonorge, then queries Kartverket directly.
- `PropertyPickerPopover` component: checkbox list of candidates with colour swatches, distance, confirm/cancel, hover-highlight on map.
- `useMapInteraction` hook: exports `handleMapClick`, `confirmPick`, `cancelPick`, `clear`, `picker` state.

**2.7 Cleanup** ✅

- `PanelToggleControl.tsx` deleted.
- All spinners in map feature use `sweco-spinner` class (replaced FA `fa-spinner fa-spin`).
- Address marker hidden when multiple properties are selected to reduce clutter.
- Tooltip/typeahead collision fixed via CSS `data-has-suggestions` attribute.

### Phase 3 — Extended Features ✅ COMPLETED

Focus: Layer controls, screenshots, and export capabilities.

**3.1 WMS layer controls** ✅

- Added `LayersControl` (topright) with 6 WMS overlays + "Farget eiendom" polygon layer.
- WMS layer URLs and layer names confirmed against each service's GetCapabilities:

| Layer | WMS URL | Layer name(s) | Default |
|---|---|---|---|
| Matrikkelkart | `https://wms.geonorge.no/skwms1/wms.matrikkelkart` | `matrikkelkart` | ✅ On |
| Radon | `https://geo.ngu.no/mapserver/RadonWMS2` | `Radon_aktsomhet` | Off |
| Flomsone 50 års flom | `https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer` | `Flomsone_50arsflom` | Off |
| Flomsone 100 års flom | `https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer` | `Flomsone_100arsflom` | Off |
| Flomsone 200 års flom | `https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer` | `Flomsone_200arsflom` | Off |
| Skredfaresone 100 års | `https://nve.geodataonline.no/arcgis/services/Skredfaresoner1/MapServer/WMSServer` | `Skredsoner_100` | Off |
| Kvikkleire skred aktsomhet | `https://nve.geodataonline.no/arcgis/services/KvikkleireskredAktsomhet/MapServer/WMSServer` | `KvikkleireskredAktsomhet` | Off |
| Farget eiendom | Local polygon layer (`LayerGroup`) | N/A | ✅ On |

- Layers defined as `wmsLayersOptions` array in `config/wmsLayers.ts`; each rendered via `<WMSTileLayer>` inside `<LayersControl.Overlay>`.
- "Farget eiendom" is a local `<LayerGroup>` containing coloured `<Polygon>` components for selected properties.
- **Planavgrensning** removed — Geonorge `wms.planomraade` down (systemic `msLoadMap()` error). Can re-add when service is restored.
- **Flomsone layers** only render in areas with NVE hydraulic modelling (inland river valleys). Bergen/coastal areas typically have no coverage.
- Layers control toggle aligned at 32×32px; Sweco-styled checkboxes with custom SVG checkmarks. Dark mode `filter: invert(0.85)` on toggle icon.

**3.2 Map screenshot** ✅

- Integrated `leaflet-simple-map-screenshoter` as a camera-button control (bottomleft).
- Uses the plugin's native `takeScreen("image")` method which internally uses `dom-to-image-more`.
- `hideElementsWithSelectors` configured to hide `.leaflet-control-container`, `.map-search-control`, `.property-picker` during capture.
- Screenshot stored as base64 in Zustand store (`screenshotBase64`), now **persisted** via `partialize` — survives page refresh and route changes.
- Preview thumbnail rendered in SidePanel `preFooter` section (above the footer divider) with max-width 280px, centred.
- "Fjern kartutsnitt" button (`btn-tertiary`) in footer clears both the UI and the persisted store entry.
- Camera icon has dark-mode CSS override with white-filled SVG `background-image` (no `filter:invert`).
- Dynamic import for the plugin (no ESM shipping) with `callbackRef` pattern for fresh callbacks.
- Type declarations in `leaflet-simple-map-screenshoter.d.ts`.

**3.3 Export / integration hooks** ✅

- `useMapExport` hook in `hooks/useMapExport.ts` exposes:
  - `selected` — reactive selected properties list
  - `screenshotBase64` — latest map screenshot or null
  - `getExportData()` — builds a serialisable `MapExportData` snapshot
  - `clearScreenshot()` — clears the stored screenshot
- `MapExportData` type: `{ properties: Array<{key, property, address, colourIndex}>, screenshotBase64: string | null }`
- Ready for consuming apps to embed the map service and extract data for reports/PDFs.

**3.4 Toast SVG icons** ✅

- Replaced placeholder SVGs in `ToastContainer.tsx` with outlined stroke-based icons matching Sweco design guide.
- Icons: success (checkmark circle), warning (triangle exclamation), attention (info circle), error (X circle).

**3.5 UX refinements (from iterative feedback rounds)**

- **FlyTo / FitBounds**: Only triggers on initial page load with stored properties — no more disorienting zoom animations on every click/search.
- **SidePanel `preFooter` prop**: Screenshot preview renders above the footer divider; footer only contains action buttons.
- **Footer always visible**: "Fjern alle" button always shown (not conditional on properties being selected).
- **Button icon-text gap**: Text wrapped in `<span>` elements so Tailwind `space-x` (from `.btn` base class) works correctly.
- **Layers toggle sizing**: 34×34px to match panel toggle button.

**3.6 Potential future: backend extraction**

- The `api/` and `domain/` layers are already framework-agnostic TypeScript.
- Design is intentional: can be transliterated to Python/FastAPI when a backend proxy is needed (e.g. for API keys, caching, aggregation).

### Phase 4 — Code Quality, Layer UX, and Tabbed SidePanel ✅ COMPLETED

Focus: Harden the codebase (dead code, god-objects, duplication), polish the layer control UX to Sweco standards, and evolve the SidePanel into a tabbed component — all prerequisites before fetching data from WMS layers.

**4.1 Code cleanup & refactoring** ✅

A thorough code audit identified the issues below. Fix them before adding new features.

*4.1.1 Delete dead files*

- `ui/SearchBar.tsx` — fully superseded by `MapSearchControl.tsx`. **Delete.**
- `ui/PropertyInfoPanel.tsx` — not imported anywhere. **Delete.**
- `domain/propertySelection.ts` — logic duplicated inline in `useMapInteraction.ts`. Either **delete** and keep the hook's inline logic, or wire the hook to use the domain function (preferred — keeps domain logic testable).
- `ui/leaflet-simple-map-screenshoter.d.ts` — types are redeclared inside `MapScreenshotControl.tsx`. Consolidate into one place (prefer the `.d.ts` file) and remove the duplicate from the component.

*4.1.2 Split `MapView.tsx` (~514 → ~200 lines)*

Currently mixes 7 concerns. Extract:

| Extract | Target file |
|---|---|
| `wmsLayersOptions` array + `WmsLayerOption` type | `config/wmsLayers.ts` |
| `PropertyPopupContent` component (~70 lines) | `ui/PropertyPopupContent.tsx` |
| `MapClickHandler`, `FlyTo`, `FitBounds`, `ResizeOnPanel`, `AdjustTopRightControls` | `ui/mapEffects.tsx` |
| `geoJsonToLeafletPositions`, `faLocationIcon` | `ui/mapUtils.ts` |
| `MapClickEvent` type | `domain/types.ts` (avoids hook→UI dependency inversion) |

*4.1.3 Split `MapSearchControl.tsx` (~551 → ~250 lines)*

- Extract `parsePartialMatrikkel` → `domain/matrikkelParser.ts`. Unify with `propertyLookup.ts`'s `parseMatrikkelText` (two separate matrikkel parsers exist today).
- Extract duplicated keyboard navigation (ArrowDown/Up/Enter/Escape) into a shared handler function or `useKeyboardNavigation` hook.
- Extract the Kartverket-fallback-to-fake-`OutputAdresse` mapping → domain or API layer mapper.
- Extract `DEBOUNCE_MS = 300` and `RESULTS_PER_PAGE = 50` to named constants.

*4.1.4 Deduplicate API clients*

- `geonorgeClient.ts` and `kartverketClient.ts` both have identical `buildUrl()` and `fetchJson()` wrappers with the same error-mapping switch. Extract a shared `createApiClient(baseUrl, serviceName)` factory into `fetchUtils.ts`.

*4.1.5 Store & domain cleanup*

- Move `PROPERTY_COLOURS` from the store to a shared constants/theme file.
- Move `matrikkelKey()` from the store to `domain/types.ts`.
- Consider making `selected` a derived selector instead of a separately stored field.
- Extract the ~40-line `fitBounds` bounding-box computation from `MapPageView.tsx` into a domain utility (`domain/geometryUtils.ts` or similar).
- Name all magic numbers in `propertyLookup.ts` (radius: 50/100/200, treffPerSide: 1/5).

*4.1.6 CSS cleanup (optional, lower priority)*

- `map.css` is 1181 lines covering 11 sections. Consider splitting per concern (`map-leaflet.css`, `map-popup.css`, `map-panel.css`, `map-search.css`, etc.) — only if it aids maintainability without breaking import order.
- Extract repeated dark-mode hex colours (`#1c1c1c`, `#252525`, `#444`, `#d1d5db`) into CSS custom properties.
- Reduce the 4× repeated close-button SVG data-URI to a single SVG using `currentColor`.

*4.1.7 Minor fixes*

- `SidePanel.tsx`: move `clamp()` to module scope (recreated every render).
- `SidePanel.tsx`: `aria-hidden` should be boolean `{!open}`, not string `"true"/"false"`.
- `PropertyTable.tsx`: replace inline `opacity: 0.3` / hardcoded `#6b7280` with CSS classes.
- `PropertyPickerPopover.tsx`: add `role="button"` + `tabIndex` to backdrop (a11y).
- `MapScreenshotControl.tsx`: replace `console.error` with toast/error handling.
- `MapPageView.tsx`: 15 individual `usePropertySelectionStore((s) => s.xxx)` calls → consider `useShallow` or a wrapper hook.

**4.2 Layer control sizing**

- Change the layers toggle from 34×34px → 32×32px (standard icon grid).
- Verify the inner Leaflet icon/chevron still has sufficient padding at 32px. If the 2px served as padding for the icon, keep 34px — but document the decision.
- Update all CSS references in `map.css`.

**4.3 Layer control UX/UI overhaul**

The current layers dropdown (see screenshot) looks unpolished. Required improvements:

| Issue | Fix |
|---|---|
| Default Leaflet checkboxes | Replace with **Sweco design guide checkbox** styling (custom `appearance: none` + Sweco check SVG or `accent-color` approach) |
| Checkbox/label misaligned | Set `display: flex; align-items: center;` on each layer row |
| Inconsistent row spacing | Apply uniform `gap` or `padding` between layer items |
| Rectangular feel (no rounding) | Add `border-radius` to the dropdown container (e.g. `8px`) |
| All overlay controls feel rectangular | Add matching `border-radius` to zoom buttons, layers toggle, screenshot button (except search bar which is already pill-shaped) |
| Hover states lacking | Add subtle `background-color` transition on layer row hover for feedback |
| Layer order | Move **"Farget eiendom"** to the top of the list (always on, most important) |

**4.4 WMS layer validation**

Before building `GetFeatureInfo` queries, manually test each WMS source:

| Layer | Test |
|---|---|
| Matrikkelkart (Geonorge) | Renders at zoom 5–18? Layer name `matrikkelkart` correct? |
| Planavgrensning (Geonorge) | Renders? Correct layer name `PLANOMRADE_WMS`? |
| Radon (NGU) | Renders at property-level zoom (~15)? |
| Flomsone 50 års (NVE) | Endpoint alive? Layer `Flomsone_50arsflom` renders? |
| Skredfaresone 100 års (NVE) | Layer `Skredsoner_100` renders at expected zoom? |
| Kvikkleire (NVE) | Layer `KvikkleireskredAktsomhet` renders? |

Document which layers support `GetFeatureInfo` and in what response format (`text/html`, `application/json`, `application/geo+json`). This directly feeds Phase 5.

**4.5 Tabbed SidePanel**

Using Sweco's **`tablist tablist-sm`** pattern (design guide):

- `<div role="tablist" class="tablist tablist-sm">`
- Each tab: `<button role="tab" class="btn btn-quaternary btn-sm" aria-selected="true|false">`
- Active tab gets `class="active btn btn-quaternary btn-sm"`
- Text wrapped in `<span>` inside button (for icon+text gap via `space-x`)

Target panel structure:

```
┌─────────────────────────┐
│ Route name (header)     │
├─────────────────────────┤
│ Tab1 │ Tab2 │ Tab n…    │
├─────────────────────────┤
│                         │
│ Tab-specific content    │
│                         │
├─────────────────────────┤
│ Footer (global + tab    │
│ CTAs: Fjern alle, etc.) │
└─────────────────────────┘
```

Implementation tasks:

- Add `tabs` prop to `SidePanel.tsx`: `Array<{ id: string; label: string; icon?: ReactNode }>`.
- Render Sweco `tablist tablist-sm` between header and content area.
- Manage active tab state internally (or lift to parent via `activeTab`/`onTabChange` props).
- Tab content area renders `children` based on active tab (e.g. via render prop or slot pattern).
- Footer supports both **global CTAs** ("Fjern alle") and **tab-specific CTAs** (e.g. "Fjern kartutsnitt" only on Eiendommer tab).
- First tab: **"Eiendommer"** — houses current `PropertyTable` + screenshot preview (`preFooter` content moves inside this tab).
- Additional tabs (Generelt, Klima, Risiko) added as empty placeholders initially — populated in Phase 5 when `GetFeatureInfo` data is available.

### Phase 5 — Active Property, GetFeatureInfo & Tab Data

Focus: Make tabs functional by introducing an "active property" concept, querying WMS layers for analysis data, and polishing tab UX. Prerequisite: Phase 4 completed (tabbed SidePanel, validated WMS layers).

**5.1 Property click-select from map polygons**

- Currently, clicking a selected property's polygon shows the `PropertyPopupContent` info card.
- Enhancement: clicking a selected polygon should **also set that property as the "active" property** for the Generelt/Klima/Risiko tabs.
- The active property determines which property's data is shown in the analysis tabs.
- Implementation: add an `activeKey` state to the selection store. Clicking a polygon sets `activeKey`. The popup still shows. Tab content queries data for the active property.
- Visual indicator in PropertyTable for the active property (e.g. bold row / left accent / highlight).

**5.2 Tab UX — empty states & active property header**

- **Empty state**: When no property is selected (or active), Generelt/Klima/Risiko tabs show a user-guiding message: *"Velg en eiendom for å se informasjon"* (centred, muted text, perhaps with a small icon).
- **Active property header**: When a property is active, display a compact info row at the top of the content area (just below the tab bar) showing: `Eiendom #`, `Adresse`, `Gnr/Bnr`, `Fnr` — essentially a mirror of the selected row from the Eiendommer tab. This gives context in every analysis tab without switching back.
- The header should be a shared component used by Generelt, Klima, and Risiko tabs.

**5.3 GetFeatureInfo queries**

- Query each WMS service at the active property's centroid coordinates.
- Parse responses (HTML/JSON/GeoJSON) into structured domain types.
- Cache results per matrikkel key.
- Display as status rows with pass/warn/fail icons (✅/⚠️ pattern).

| Tab | Data points | Source |
|---|---|---|
| **Klima** | Flom (50/100/200 år), Skred (100 år) | NVE WMS GetFeatureInfo |
| **Risiko** | Radon (Lav/Moderat/Høy), Kvikkleire, Grunnforhold | NGU Radon WMS, NVE Skred APIs |
| **Generelt** | Ownership, area, zoning, permitted use | Kartverket / Matrikkelen / Plan API |

**5.4 Post-implementation brainstorm**

- After 5.1–5.3 are complete, run a brainstorming session to identify additional capabilities and analyses that would be valuable in the app.
- Topics to explore: additional WMS data sources, report/PDF export, comparison views, historical data, AI-assisted analysis.
- ✅ **Completed** — see section 3.1 below.

**5.5 Known limitations & future work**

- **Planavgrensning** (`wms.planomraade`, layer `PLANOMRADE_WMS`) — Geonorge MapServer has systemic `msLoadMap()` failure as of 2026-02-27. All `wms.geonorge.no/skwms1/wms.plan*` endpoints affected. Monitor and re-add when restored.
- **Matrikkelkart group layer** (`matrikkelkart`) — Geonorge MapServer returns `ServiceExceptionReport` with `msShapefileOpen()` errors for the group layer as of 2026-02-27. The `teiger` sub-layer works correctly and is used instead.
- **NVE flood zones** only cover hydraulically modelled areas (inland rivers). Coastal cities (Bergen, Stavanger) may have no data — "Ingen data tilgjengelig" is shown explicitly.
- **NGU Radon text/plain** — The `text/plain` INFO_FORMAT from NGU MapServer does not include property attributes (only Feature ID). Switched to `application/vnd.ogc.gml` format which includes `aktsomhetgrad` and `aktsomhetgrad_besk` elements.
- **SwecoGPT / AI integration** (Planslurpen) — moved to future release. Requires SwecoGPT API access configuration (backend proxy for auth). Likely needs separate ADR.

**5.6 Open questions for Phase 5**

1. ~~Which NVE/NGU APIs provide structured (non-WMS) risk data for point queries?~~ — Resolved: GML format for NGU, GeoJSON for NVE. Both work reliably.
2. Multi-property tab strategy — start with active property only (simpler) or add a per-property selector dropdown? → Started with active-only; per-property dropdown planned for Phase 6 (E2).
3. ~~NVE flood zones: should we show "no data" explicitly or just leave the section empty?~~ — Resolved: showing "Ingen data tilgjengelig" with a grey no-data indicator.

---

### 3.1 Brainstorm — Additional Capabilities (Phase 6+)

> Brainstormed 2026-02-27 after completing Phase 5. Ideas grouped by theme, ordered by value vs. effort.

#### Priority 1 — High Value, Quick-to-Medium Effort

These should be implemented first, roughly in this order:

| # | Capability | Source / Notes | Effort | Value |
|---|---|---|---|---|
| **A2** | **Grunnforhold (soil/ground)** | NGU `Løsmasser WMS` / `Berggrunnskart WMS` — loose deposits (clay, sand, rock) + bedrock type. Fits naturally in Risiko tab. | S | High |
| **A3** | **Kulturminner (heritage)** | Riksantikvaren `Askeladden WMS`/API — heritage protection restrictions. Important for renovation. | S | Medium |
| **A4** | **Støysoner (noise zones)** | Geonorge `Støy WMS` — road/rail/airport noise class. New Miljø tab or added to Klima. | S | Medium |
| **A5** | **Naturvernområder** | Miljødirektoratet `NaturbaseKart WMS` — protected nature + habitat types. Environmental impact. | S | Medium |
| **A6** | **Forurenset grunn** | Miljødirektoratet `Grunnforurensning` REST + WMS — contaminated ground. Critical for due diligence. | M | High |
| **A8** | **Kommuneplan (zoning)** | Geonorge `wms.kommuneplan` — broad zoning (bolig, næring, LNF). More reliable than reguleringsplan. | S | High |
| **D1** | **Historical flood events** | NVE historical flood event data — "last major flood: 2023" with return period context. | M | Medium |

> **A1 — Reguleringsplan**: Depends on `wms.planomraade` (currently down). Monitor Geonorge & re-add when restored. May require paid subscription — needs verification.

#### Priority 2 — Comparison & Multi-Property Analysis

These become valuable once Priority 1 data sources are integrated:

| # | Capability | Notes | Effort | Value |
|---|---|---|---|---|
| **C3** | **Batch GetFeatureInfo** | Auto-query ALL selected properties (not just active). Pre-populate cache so switching is instant. Rate-limited queue. | S | Medium |
| **C2** | **Property scoring badges** | Aggregate pass/warn/fail into composite score per property (shown in PropertyTable). Instant visual triage. | M | High |
| **C1** | **Side-by-side comparison** | Compare 2-4 properties' data in a matrix view. Useful for site selection. | M | High |

#### Priority 3 — Report & Export

| # | Capability | Notes | Effort | Value |
|---|---|---|---|---|
| **B3** | **Share link / deep-link** | Encode selected properties in URL query params. Bookmarkable + shareable. E.g. `/map?props=4601-33-2&active=4601-33-2`. | S | Medium |
| **B2** | **CSV/Excel export** | Export PropertyTable + GetFeatureInfo as spreadsheet. Quick win with `xlsx` library. | S | Medium |
| **B4** | **Print-optimized layout** | CSS `@media print` for clean A4 page. Cheaper than PDF generation. | M | Medium |
| **B1** | **PDF eiendomsrapport** | One-click report: map screenshot + all tab data. `@react-pdf/renderer` or server-side. **Flagship deliverable**. | L | Very High |

#### Priority 4 — UX Enhancements

| # | Capability | Notes | Effort | Value |
|---|---|---|---|---|
| **E1** | **Keyboard navigation** | Arrow up/down in PropertyTable to cycle active property. Accessibility + power-user. | S | High |
| **E2** | **Per-property tab selector** | Dropdown/chips in header to switch active property without going to Eiendommer tab. | S | Medium |
| **E3** | **WMS layer legend** | Mini-legend for each enabled WMS layer (flood zone colour scale, etc.). | S | Medium |
| **E4** | **Measurement tools** | Distance/area measurement on the map. Leaflet.Draw or custom. | M | Medium |

#### Priority 5 — Historical & Advanced Data

| # | Capability | Notes | Effort | Value |
|---|---|---|---|---|
| **A7** | **Høyde / terrengprofil** | Kartverket `Høydedata` API — elevation + slope at property. Useful for stormwater/solar. | M | Low |
| **D2** | **Aerial photo timeline** | Kartverket / Norge i bilder historical orthofotos (1950s–present). Impressive but high effort. | L | Low |
| **D3** | **Price / transaction history** | SSB / Eiendomsverdi API. Needs licensing review. | L | Medium |

#### Priority 6 — AI-Assisted Analysis

| # | Capability | Notes | Effort | Value |
|---|---|---|---|---|
| **F1** | **SwecoGPT "Ask about this property"** | Send all data as context to SwecoGPT. Natural language Q&A. Needs backend proxy + ADR. | L | Very High |
| **F2** | **Auto-generated risk summary** | LLM-generated 2-3 sentence summary of all risk data. Client-side or via SwecoGPT. | M | High |
| **F3** | **Smart property recommendations** | Given criteria, suggest properties from broader search. Exploratory. | L | Medium |

#### Recommended Phase 6 Scope

Based on **high value + reasonable effort**, suggested Phase 6 grouping:

1. **A2 — Grunnforhold** (S) — ✅ **Implemented**. Løsmasser (NGU LosmasserWMS) + Berggrunn (NGU BerggrunnWMS) added as WMS GetFeatureInfo. GML parsing via `safeParse()`. Grouped under "Grunnforhold (NGU)" heading in Risiko tab.
2. **A3 — Kulturminner** (S) — ✅ **Implemented**. Riksantikvaren ArcGIS REST MapServer (layer 5). 200m radius spatial query. Compact cards with expand/collapse (show 5, then "Vis alle"). Now in Miljø tab.
3. **A4 — Støysoner** (S) — ✅ **Implemented**. Three sources: Miljødirektoratet ArcGIS REST (veg), Bane NOR WMS (jernbane), Forsvaret WMS (militær/skytebane). Data freshness warnings. Now in Miljø tab.
4. **C3 — Batch GetFeatureInfo** (S) — ✅ **Implemented**. `useBatchFeatureInfo` hook pre-fetches all selected properties. Timer cleanup fixed, concurrency capped at 3, 500ms initial delay for active property priority.
5. **Tab reorganization** — ✅ **Implemented**. 5-tab layout: Eiendommer, Generelt, Klima (+ kvikkleire moved here), Risiko (radon + grunnforhold only), Miljø (kulturminner + støy).
6. **A6 — Forurenset grunn** (M) — ⬜ Pending. Miljødirektoratet REST API.
7. **A5 — Naturvernområder** (S) — ⬜ Pending. Miljødirektoratet NaturbaseKart WMS.
8. **A8 — Kommuneplan** (S) — ⬜ Pending. Geonorge `wms.kommuneplan`.
9. **D1 — Historical flood events** (M) — ⬜ Pending.
10. **C2 — Property scoring badges** (M) — ⬜ Deferred to Phase 7.
11. **C1 — Side-by-side comparison** (M) — ⬜ Deferred to Phase 7.

After Phase 6: **B1 (PDF report)**, **E1 (keyboard nav)**, **B3 (share link)**, **F1 (SwecoGPT)**.

---

## 4. Technical Context

### Stack

| Concern | Technology |
|---|---|
| Framework | React 19, Vite 6, TypeScript 5.8 |
| Routing | React Router DOM 7 (route objects with `handle.nav` for sidebar) |
| Styling | Tailwind CSS v4, Sweco design system (`sweco-tailwind.css`) |
| State | Zustand 5 (stores in `app/stores/` and `shared/`) |
| Map | Leaflet 1.9.4, React Leaflet 5.0.0 |
| Dark mode | Custom variant: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` |
| Path aliases | `@/` → `src/`, `@features/` → `src/features/`, `@shared/` → `src/shared/`, etc. |

### APIs

| API | Base URL | Auth | Key Endpoints |
|---|---|---|---|
| Kartverket Eiendom v1 | `https://api.kartverket.no/eiendom/v1` | None | `/geokoding` (matrikkel → point/area), `/punkt` (coords → properties), `/punkt/omrader` (coords → GeoJSON polygons) |
| Geonorge Adresser v1 | `https://ws.geonorge.no/adresser/v1` | None | `/sok` (free-text search), `/punktsok` (coords → nearest addresses) |

### Key Files

| File | Role |
|---|---|
| `src/features/map/MapPageView.tsx` | Page orchestrator — wires MapView + SidePanel + toggle, manages `highlightedKey` state, tab definitions (Eiendommer/Generelt/Klima/Risiko) |
| `src/features/map/ui/MapView.tsx` | Leaflet map: polygons, popups (`PropertyPopupContent`), tooltips, search, zoom, fly-to, click handler. WMS overlays via `wmsLayersOptions` array |
| `src/features/map/ui/MapSearchControl.tsx` | Pill-shaped floating search bar (Leaflet control, `topleft`) with address/matrikkel modes, dual typeahead (Geonorge + Kartverket fallback) |
| `src/features/map/ui/SidePanel.tsx` | Resizable right side-panel overlay (z-1000) with tabs (`tablist tablist-sm` Sweco pattern), pointer-drag resize |
| `src/features/map/ui/PropertyTable.tsx` | Property table with 5 columns, row highlight, click-to-highlight, Fjern alle |
| `src/features/map/ui/PropertyPickerPopover.tsx` | Disambiguation popover for ambiguous map clicks (checkbox list, colour swatches, hover-highlight) |
| `src/features/map/stores/propertySelection.store.ts` | Zustand v5 persist store — project-scoped property selections, panel state, colour palette |
| `src/features/map/domain/propertyLookup.ts` | 3 lookup flows + domain mappers. Free-text matrikkel parsing. |
| `src/features/map/domain/types.ts` | Domain models (Property, Address, SearchQuery, LatLng, etc.) |
| `src/features/map/api/fetchUtils.ts` | Shared `fetchJsonWithRetry` with timeout + exponential backoff retry |
| `src/features/map/api/kartverketClient.ts` | Kartverket Eiendom v1 HTTP client (uses fetchJsonWithRetry) |
| `src/features/map/api/geonorgeClient.ts` | Geonorge Adresser v1 HTTP client (uses fetchJsonWithRetry) |
| `src/features/map/api/types.ts` | API response type mirrors |
| `src/features/map/hooks/usePropertySearch.ts` | Search hook (loading/error/result) |
| `src/features/map/hooks/useMapInteraction.ts` | Map-click hook with disambiguation (auto-nearest / picker) |
| `src/features/map/map.css` | All map CSS consolidated (~1300 lines) — Leaflet overrides, panel, tabs, table, search, dark mode, Sweco checkboxes, WMS controls, screenshot button, preFooter/footer layout |
| `src/features/map/config/wmsLayers.ts` | WMS overlay layer definitions (7 layers). `WmsLayerOption` type + `wmsLayersOptions` array |
| `src/features/map/config/wms-validation.md` | WMS endpoint validation documentation (GetCapabilities, GetFeatureInfo support) |
| `src/features/map/ui/MapScreenshotControl.tsx` | Screenshot control (bottomleft) — lazy-loads `leaflet-simple-map-screenshoter`, intercepts click, calls `takeScreen("image")` |
| `src/features/map/ui/leaflet-simple-map-screenshoter.d.ts` | TypeScript declarations for the untyped screenshoter package |
| `src/features/map/hooks/useMapExport.ts` | Export hook for consuming apps — exposes selected properties + screenshot as `MapExportData` |
| `src/shared/ui/toast/` | App-wide toast store + container (Zustand) with outlined stroke-based SVG icons |
| `src/app/layout/Root.tsx` | App shell — `<main>` has `relative z-0` stacking context, header at z-20 |
| `src/app/router/routeTypes.ts` | `AppRouteHandle` with `fullWidth?: boolean` flag |
| `src/app/router/router.tsx` | Route config — map at path `'map'`, order 5, `fullWidth: true` |

### Sweco Colour Palette (for polygon cycling)

```
green:  fill #87be73, stroke #538840
blue:   fill #98bddc, stroke #3a7dbf
peach:  fill #de845d, stroke #874c33
sand:   fill #c6b37c, stroke #989077
green2: fill #bde3af, stroke #3f6730
blue2:  fill #d6e4f1, stroke #293c53
```

---

## 5. Old App Code Snippets (Reference Only)

The old Bootstrap app's code is **not** usable 1:1 (different design system, missing dark mode, single API, Bootstrap components). However, these patterns are useful structural references. The full source is inlined below.

### 5.1 `MapSearchControl.tsx` — Floating search as a Leaflet control

Pattern: `createPortal` + `L.Control` to render a React form inside the Leaflet control container. Disables click/scroll propagation so the form doesn't interact with the map tile.

```tsx
import L, { ControlPosition } from 'leaflet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';

type Props = {
    position?: ControlPosition;
    placeholder?: string;
    initial?: string;
    onSubmit: (query: string) => void;
    onClear?: () => void;
    helperText?: string;
};

export default function MapSearchControl ({
    position = "topleft",
    placeholder = "Søk etter adresse...",
    initial = "",
    onSubmit,
    onClear,
    helperText,
}: Props) {
    const map = useMap();
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [value, setValue] = useState(initial);
    const helpId = "map-search-help";

    const control = useMemo(() => {
        const c = new L.Control({ position });
        c.onAdd = () => {
            const div = L.DomUtil.create("div", "leaflet-control map-search");
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.on(div, "pointerdown", L.DomEvent.stopPropagation);
            L.DomEvent.on(div, "pointerup", L.DomEvent.stopPropagation);
            containerRef.current = div;
            return div;
        };
        return c;
    }, [position]);

    useEffect(() => {
        control.addTo(map);
        setMounted(true);
        return () => {
            control.remove();
            setMounted(false);
            containerRef.current = null;
        };
    }, [map, control]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = value.trim();
        if (q) onSubmit(q);
    };

    const clear = () => {
        setValue("");
        onClear?.();
    };

    if (!mounted || !containerRef.current) return null;

    return createPortal(
        <>
            <form className="map-search-form" onSubmit={submit} role="search">
                <span className='ms-left-icon' aria-hidden="true">
                    <i className="fa-light fa-magnifying-glass"></i>
                </span>
                <input
                    className='ms-input'
                    type='text'
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={placeholder}
                    aria-label="Søk i kart"
                    aria-describedby={helperText ? helpId : undefined}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            clear();
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                />
                {value && (
                    <button type='button' className='ms-btn ms-clear' onClick={clear} aria-label='Tøm søk' title="Tøm">
                        <i className="fa-light fa-x"></i>
                    </button>
                )}
            </form>
            {helperText && (
                <small id={helpId} className='ms-help text-muted'>{helperText}</small>
            )}
        </>,
        containerRef.current
    );
}
```

### 5.2 `PanelToggleControl.tsx` — Map button to show/hide panel

```tsx
import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

type Props = {
    isOpen: boolean;
    onToggle: () => void;
    title?: string;
};

export default function PanelToggleControl({ isOpen, onToggle, title = 'Panel' }: Props) {
    const map = useMap();

    useEffect(() => {
        const C = L.Control.extend({
            options: { position: 'topright' as L.ControlPosition },
            onAdd: () => {
                const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                const a = L.DomUtil.create('a', '', div);
                a.href = '#';
                a.title = title;
                a.style.width = '34px';
                a.style.height = '34px';
                a.style.lineHeight = '34px';
                a.style.textAlign = 'center';
                a.style.fontWeight = '600';
                a.innerText = isOpen ? '»' : '«';
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.on(a, 'click', (e: any) => {
                    L.DomEvent.preventDefault(e);
                    onToggle();
                });
                return div;
            }
        });
        const control = new C();
        map.addControl(control);
        return () => { map.removeControl(control); };
    }, [map, isOpen, onToggle, title]);

    return null;
}
```

### 5.3 `PropertyMap.tsx` — Main map with layers, WMS, screenshot, resize

```tsx
import { LatLng, LatLngBounds, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import {
    LayerGroup, LayersControl, MapContainer, TileLayer,
    useMap, WMSTileLayer, ZoomControl,
} from 'react-leaflet';
import { GeoNorgeAddress } from '../../types/geoNorge';
import { MapCoordinate, PropertyPolygonParameters } from '../../types/types';
import { Button } from '../utils/Button';
import ErrorToast from '../utils/ErrorToast';
import './Map.css';
import { MapScreenshotControl } from './MapScreenshotControl';
import MapSearchControl from './MapSearchControl';
import PanelToggleControl from './PanelToggleControl';
import PropertyPolygon from './PropertyPolygon';

const wmsLayersOptions = [
    {
        name: 'Matrikkelkart',
        url: 'https://openwms.statkart.no/skwms1/wms.matrikkelkart',
        layers: 'matrikkelkart', format: 'image/png', version: '1.3.0',
        transparent: true, opacity: 1,
    },
    {
        name: 'Radon',
        url: 'https://geo.ngu.no/mapserver/RadonWMS2',
        layers: 'Radon_aktsomhet', format: 'image/png', version: '1.1.0',
        transparent: true, opacity: 0.5,
    },
];

function ResizeOnPanel({ open }: { open: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (open) {
            map.invalidateSize();
            const a = requestAnimationFrame(() => map.invalidateSize());
            const b = setTimeout(() => map.invalidateSize(), 320);
            return () => { cancelAnimationFrame(a); clearTimeout(b); };
        } else {
            const a = requestAnimationFrame(() => map.invalidateSize());
            return () => cancelAnimationFrame(a);
        }
    }, [open, map]);
    return null;
}

interface PropertyMapProps {
    setPosition: (newPosition: MapCoordinate) => void;
    addresses: Array<GeoNorgeAddress>;
    removeAddress: (id: string) => void;
    screenshotBase64String?: string;
    setScreenshotBase64String: (url?: string) => void;
    togglePanel: () => void;
    panelOpen: boolean;
    onSearch: (query: string) => void;
    onClearSearch?: () => void;
}

export default function PropertyMap({
    setPosition, addresses, removeAddress,
    screenshotBase64String, setScreenshotBase64String,
    togglePanel, panelOpen, onSearch, onClearSearch,
}: PropertyMapProps) {
    const [mapViewExtent, setMapViewExtent] = useState<LatLngBounds>();
    const [screenshot, setScreenshot] = useState<string | null>();
    const [error, setError] = useState<Error>();

    useEffect(() => {
        const latLng: Array<LatLng> = addresses
            .map((address: GeoNorgeAddress) => address.geometri.flat(), [])
            .flat();
        if (latLng.length > 1) setMapViewExtent(latLngBounds(latLng));
        setScreenshot(screenshotBase64String);
    }, [addresses]);

    useEffect(() => { setScreenshot(screenshotBase64String); }, []);
    useEffect(() => {
        if (screenshot === undefined) return;
        setScreenshotBase64String(screenshot ?? undefined);
    }, [screenshot]);

    return (
        <div className="h-100">
            {error && <ErrorToast title={error.name} error={error?.message} toggleToast={() => setError(undefined)} />}
            {screenshot ? (
                <>
                    <img src={'data:image/png;base64, ' + screenshot} alt="map" />
                    <Button onClick={() => setScreenshot(null)}>Rediger kartutsnitt</Button>
                </>
            ) : (
                <div className="map-viewport">
                    <MapContainer
                        center={new LatLng(59.915237269718396, 10.762049142986896)}
                        bounds={mapViewExtent} zoom={17}
                        scrollWheelZoom={true} zoomControl={false}
                        style={{ height: '100%' }}
                    >
                        <MapSearchControl position="topleft" onSubmit={onSearch} onClear={onClearSearch}
                            helperText='Du kan søke på adresse (fantoftvegen 14P) eller gbnr (33/2 Rana)' />
                        <LayersControl position="topright">
                            {wmsLayersOptions.map((layer, index) => (
                                <LayersControl.Overlay key={layer.name} name={layer.name} checked={index === 0}>
                                    <WMSTileLayer maxZoom={20} url={layer.url} layers={layer.layers}
                                        format={layer.format} version={layer.version}
                                        transparent={layer.transparent} opacity={layer.opacity} />
                                </LayersControl.Overlay>
                            ))}
                            <LayersControl.Overlay key="fargekart" name="Farget eiendom" checked={true}>
                                <LayerGroup>
                                    {addresses.map((address: GeoNorgeAddress) => (
                                        <PropertyPolygon
                                            parameters={{ geometry: address.geometri, address: address.adressetekst, color: address.color } as PropertyPolygonParameters}
                                            onClick={(id) => removeAddress(id)} />
                                    ))}
                                </LayerGroup>
                            </LayersControl.Overlay>
                        </LayersControl>
                        <ZoomControl position="bottomleft" />
                        <MapScreenshotControl
                            setScreenshotBase64String={(v?: string) => setScreenshot(v)}
                            setPosition={(c: MapCoordinate) => setPosition(c)}
                            mapViewExtent={mapViewExtent}
                            exportError={(err?: Error) => { if (err) setError(err); }} />
                        <TileLayer maxZoom={20}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <PanelToggleControl isOpen={panelOpen} onToggle={togglePanel} />
                        <ResizeOnPanel open={panelOpen} />
                    </MapContainer>
                </div>
            )}
        </div>
    );
}
```

### 5.4 `PropertyPolygon.tsx` — Polygon with tooltip + click-to-remove

```tsx
import { DomEvent, LeafletEvent } from "leaflet";
import { Polygon, Tooltip } from "react-leaflet";
import { PropertyPolygonParameters } from "../../types/types";

interface PropertyPolygonProps {
    parameters: PropertyPolygonParameters;
    onClick: (id: string) => void;
}

export default function PropertyPolygon({ parameters, onClick }: PropertyPolygonProps) {
    return (
        <Polygon
            key={parameters.address}
            pathOptions={{ color: parameters.color }}
            positions={parameters.geometry}
            eventHandlers={{
                click: (e: LeafletEvent) => {
                    onClick(parameters.address);
                    DomEvent.stopPropagation(e);
                },
            }}
        >
            <Tooltip sticky>
                <strong>Tiltakseiendom {parameters.address}</strong><br />
                {parameters.address}
            </Tooltip>
        </Polygon>
    );
}
```

### 5.5 `SidePanel.tsx` — Resizable panel with pointer-drag

```tsx
import React, { CSSProperties, ReactNode, useRef } from 'react';

type Placement = "end" | "bottom";

interface SidePanelProps {
    open: boolean;
    placement: Placement;
    width?: number;
    height?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    onResize?: (size: {width?: number; height?: number}) => void;
    onResizingChange?: (active: boolean) => void;
    title?: string;
    children?: ReactNode;
}

export default function SidePanel({
    open, placement, width, height,
    minWidth = 400,
    maxWidth = Math.min(960, typeof window !== "undefined" ? window.innerWidth * 0.8 : 960),
    minHeight = 200,
    maxHeight = Math.min(720, typeof window !== "undefined" ? window.innerHeight * 0.7 : 720),
    onResize, onResizingChange, title, children,
}: SidePanelProps) {
    const startRef = useRef<{ x: number; y: number; w: number; h: number}>();

    const style: CSSProperties = {};
    if (placement === "end" && width) (style as any)["--panel-w"] = `${width}px`;
    if (placement === "bottom" && height) (style as any)["--panel-h"] = `${height}px`;

    function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

    function onPointerDown(e: React.PointerEvent) {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        startRef.current = { x: e.clientX, y: e.clientY, w: width ?? 620, h: height ?? 360 };
        onResizingChange?.(true);
    }

    function onPointerMove(e: React.PointerEvent) {
        if (!startRef.current) return;
        const { x, y, w, h } = startRef.current;
        if (placement === "end") {
            const delta = x - e.clientX;
            onResize?.({ width: clamp(Math.round(w + delta), minWidth, maxWidth) });
        } else {
            const delta = y - e.clientY;
            onResize?.({ height: clamp(Math.round(h + delta), minHeight, maxHeight) });
        }
    }

    function onPointerUp(e: React.PointerEvent) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        startRef.current = undefined;
        onResizingChange?.(false);
    }

    return (
        <aside
            className='sidepanel bg-body'
            data-open={open} data-placement={placement}
            style={style} role="complementary" aria-hidden={!open}
        >
            <div className='sidepanel__resizer' role="separator"
                aria-orientation={placement === "end" ? "vertical" : "horizontal"}
                aria-label='Resize panel'
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp} />
            <div className="sidepanel__header border-bottom p-2">
                <h1 className='me-auto'>{title ?? "Panel"}</h1>
            </div>
            <div className='sidepanel__body p-3'>{children}</div>
        </aside>
    );
}
```

### 5.6 `AddressesTable.tsx` — Property table with colour chips

```tsx
import { Table } from "react-bootstrap";
import { GeoNorgeAddress } from "../../types/geoNorge";
import { useEffect, useState } from "react";

interface AddressesTableProps {
    addresses: Array<GeoNorgeAddress>;
    removeAddress: (key: string) => void;
    moveAddressUp: (index: number) => void;
}

export default function AddressesTable({ addresses, removeAddress, moveAddressUp }: AddressesTableProps) {
    const [_addresses, setAddresses] = useState<Array<GeoNorgeAddress>>([]);
    useEffect(() => { setAddresses(addresses); }, [addresses]);

    return (
        <Table>
            <thead>
                <tr>
                    <th>Tiltakseiendom</th>
                    <th>GeoNorgeAddress</th>
                    <th>Gnr</th>
                    <th>Bnr</th>
                    <th>Festenr</th>
                    <th>Slett</th>
                    <th>Flytt</th>
                </tr>
            </thead>
            <tbody>
                {_addresses.map((a: GeoNorgeAddress) => (
                    <tr key={a.adressetekst}>
                        <td>
                            <span style={{ border: `2px solid ${a.color}`, borderRadius: 10, padding: "1px 5px" }}>
                                Tiltakseiendom {_addresses.indexOf(a) + 1}
                            </span>
                        </td>
                        <td>{a.adressetekst}</td>
                        <td>{a.gardsnummer}</td>
                        <td>{a.bruksnummer}</td>
                        <td>{a.festenummer}</td>
                        <td style={{ width: 30, textAlign: "center" }}>
                            <button style={{ border: "none", padding: "0", background: "none", color: "red" }}
                                className="fa-light fa-trash-can" role="button"
                                onClick={() => removeAddress(a.adressetekst)} />
                        </td>
                        <td style={{ width: 30, textAlign: "center" }}>
                            <button style={{ border: "none", padding: "0", background: "none" }}
                                className="fa-sharp fa-light fa-up" role="button"
                                onClick={() => moveAddressUp(_addresses.indexOf(a))} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}
```

### 5.7 `MapScreenshotControl.tsx` — Screenshot as Leaflet control

```tsx
import { LatLngBounds, LeafletMouseEvent } from "leaflet";
import { SimpleMapScreenshoter } from "leaflet-simple-map-screenshoter";
import { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { MapCoordinate } from "../../types/types";

interface MapScreenshotControlProps {
    setScreenshotBase64String: (url?: string) => void;
    setPosition: (coordinate: MapCoordinate) => void;
    exportError: (error?: Error) => void;
    mapViewExtent?: LatLngBounds;
}

export function MapScreenshotControl({
    setScreenshotBase64String, setPosition, exportError, mapViewExtent,
}: MapScreenshotControlProps) {
    const screenshotRef = useRef<SimpleMapScreenshoter | null>(null);
    const map = useMap();
    const [error, setError] = useState<Error>();

    useEffect(() => {
        if (!mapViewExtent) return;
        map.fitBounds(mapViewExtent);
    }, [mapViewExtent, map]);

    useMapEvents({
        click: (event: LeafletMouseEvent) => {
            const coordinate: MapCoordinate = MapCoordinate(event.latlng.lat, event.latlng.lng);
            setPosition(coordinate);
        },
    });

    useEffect(() => {
        exportError(error);
        if (error) setScreenshotBase64String("");
    }, [error]);

    useEffect(() => {
        if (!screenshotRef.current) {
            const screenshotter = new SimpleMapScreenshoter({
                position: "bottomleft",
                preventDownload: true,
                mimeType: "image/png",
                screenName: "XXX",
            });
            screenshotter.addTo(map);
            map.on("simpleMapScreenshoter.click", async () => {
                const image: any = await screenshotter.takeScreen("image");
                if (typeof image === "string") {
                    const imageString = image as string;
                    setScreenshotBase64String(imageString.slice(imageString.search(",") + 1));
                } else {
                    setError({ name: "Feil ved taking av snapshot", message: (image as Error).message } as Error);
                }
            });
            screenshotRef.current = screenshotter;
        }
    });

    return null;
}
```

### 5.8 `MapWrapper.tsx` — Orchestration of multi-property state

```tsx
import { Col, Row } from "react-bootstrap";
import { useCallback, useEffect, useState } from "react";
import { Address, MapCoordinate } from "../../types/types";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { GeoNorgeAddress } from "../../types/geoNorge";
import PropertyMap from "./PropertyMap";
import {
    GeoNorgeAddressResponse, getAddressesAsync, getCadastralNumber,
    getGeometryAsync, pointSearchUrl, textSearchUrl,
} from "../../services/geonorge_api_calls";
import { ApiException, ApiResponse } from "../../services/sweco-api/_utils";
import { LatLng } from "leaflet";
import ErrorToast from "../utils/ErrorToast";
import AddressesTable from "./AddressesTable";

interface MapwrapperProps {
    initialAddresses: Array<Address>;
    screenshot: string | undefined;
    exportMapData: (addresses: Array<Address>, screenshotBase64String?: string) => void;
}

const colors: Array<string> = ["red", "orange", "yellow", "green", "darkturquoise", "blue", "indigo"];

export default function MapWrapper({ initialAddresses, screenshot, exportMapData }: MapwrapperProps) {
    const [suggestions, setSuggestions] = useState<Array<GeoNorgeAddress>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Array<ApiException>>();
    const [addresses, setAddresses] = useState<Array<GeoNorgeAddress>>([]);
    const [screenshotBase64String, setScreenshotBase64String] = useState<string>();
    const [panelOpen, setPanelOpen] = useState(true);

    // ... initial address hydration, geometry fetching, colour assignment ...
    // (See full source in chat history — omitted here for brevity, key pattern:
    //   addresses.map((a, i) => ({ ...a, color: colors[i % colors.length] }))
    // )

    const removeAddress = useCallback(
        (key: string) => setAddresses(addresses.filter(a => a.adressetekst !== key)),
        [addresses]
    );

    const moveAddressUp = useCallback(
        (index: number) => {
            const updated = addresses
                .map((_, i) => i > index || i < index - 1
                    ? addresses[i]
                    : i === index ? addresses[Math.max(index - 1, 0)] : addresses[Math.min(i + 1, addresses.length - 1)])
                .map((a, i) => ({ ...a, color: colors[i % colors.length] }));
            setAddresses(updated);
        },
        [addresses]
    );

    // ... handleSearchAsync, mapClickAsync, setAddressGeometryAsync ...

    return (
        <>
            {errors?.map(err => (
                <ErrorToast title="Server feil" error={err?.message}
                    toggleToast={() => { setErrors(undefined); setLoading(false); }} />
            ))}
            <Row className="mb-2">
                <Col>
                    <AsyncTypeahead className="mb-2" filterBy={() => true}
                        id="adresse-typeahead" isLoading={loading}
                        labelKey="adressetekst" minLength={3}
                        onSearch={async (query) => { setLoading(true); await handleSearchAsync(query); }}
                        onChange={async (adresser) => { setLoading(true); await setAddressGeometryAsync(adresser[0] as GeoNorgeAddress); }}
                        options={suggestions}
                        placeholder="Søk etter adresse.."
                        renderMenuItemChildren={(adresse) => (
                            <span>{(adresse as GeoNorgeAddress).adressetekst + ", " +
                                (adresse as GeoNorgeAddress).postnummer + " " +
                                (adresse as GeoNorgeAddress).poststed}</span>
                        )} />
                </Col>
            </Row>
            <PropertyMap
                setPosition={(p) => mapClickAsync(p)}
                addresses={addresses}
                removeAddress={removeAddress}
                setScreenshotBase64String={(v) => setScreenshotBase64String(v)}
                screenshotBase64String={screenshotBase64String}
                togglePanel={() => setPanelOpen(!panelOpen)}
                panelOpen={panelOpen}
                onSearch={onSearch}
                onClearSearch={onClearSearch} />
            <AddressesTable addresses={addresses} removeAddress={removeAddress} moveAddressUp={moveAddressUp} />
        </>
    );
}
```

---

## 6. Prompt for Next Session

Copy the below into a new chat session to continue:

---

**Context**: I'm building a property map service in `NO-Ask` at `src/features/map/`. Read `proposal/proposals/map-feature-continuation-prompt.md` for the full handoff document. Related docs: `proposal/proposals/map-service-proposal.md` (proposal), `proposal/tads/map-service-tad.md` (TAD with architecture diagrams), ADRs 004–009.

**Current state**: Phases 1–5 complete. Phase 6 approximately 60% complete:

- **Phase 1**: Full-viewport map, floating search, resizable SidePanel, panel toggle
- **Phase 2**: Dual-API integration (Kartverket + Geonorge), multi-property selection, search debounce/typeahead, error resilience, 1-click=1-property UX
- **Phase 3**: 8 WMS overlays, screenshot, export hook, dark/light mode
- **Phase 4**: Code cleanup/refactoring, Sweco-styled layer control, WMS validation, tabbed SidePanel
- **Phase 5**: Active property click-select, 7-query GetFeatureInfo, tab data rendering, empty states
- **Phase 6 (in progress)**:
  - ✅ A2 — Grunnforhold: Løsmasser (NGU LosmasserWMS, GML) + Berggrunn (NGU BerggrunnWMS, GML)
  - ✅ A3 — Kulturminner: Riksantikvaren ArcGIS REST MapServer (layer 5, 200m radius query)
  - ✅ A4 — Støysoner: 3 sources — Miljødirektoratet REST (veg), Bane NOR WMS (jernbane), Forsvaret WMS (militær)
  - ✅ C3 — Batch GetFeatureInfo: `useBatchFeatureInfo` with timer cleanup, concurrency cap (3), deprioritization
  - ✅ 5-tab layout: Eiendommer, Generelt, Klima (+kvikkleire), Risiko (radon+grunnforhold), Miljø (kulturminner+støy)
  - ⬜ A5 — Naturvernområder (Miljødirektoratet NaturbaseKart WMS)
  - ⬜ A6 — Forurenset grunn (Miljødirektoratet Grunnforurensning REST)
  - ⬜ A8 — Kommuneplan (Geonorge `wms.kommuneplan`)

**Current file structure** (`src/features/map/`):

```
api/         — fetchUtils.ts, kartverketClient.ts, geonorgeClient.ts, kulturminnerClient.ts, stoySonerClient.ts, wmsFeatureInfoClient.ts, types.ts
config/      — featureInfoEndpoints.ts (11 WMS endpoints), wmsLayers.ts, wms-validation.md
domain/      — types.ts, propertyLookup.ts, propertySelection.ts, matrikkelParser.ts, featureInfoTypes.ts, featureInfoParser.ts, constants.ts
hooks/       — useFeatureInfo.ts (single + batch), usePropertySearch.ts, useMapInteraction.ts, useMapExport.ts
stores/      — propertySelection.store.ts (Zustand persist), featureInfo.store.ts (in-memory cache)
ui/          — MapView.tsx, MapSearchControl.tsx, SidePanel.tsx, PropertyTable.tsx, PropertyPickerPopover.tsx, PropertyPopupContent.tsx, MapScreenshotControl.tsx, ActivePropertyHeader.tsx, GenereltTab.tsx, KlimaTab.tsx, RisikoTab.tsx, MiljoTab.tsx, StatusRow.tsx, TabEmptyState.tsx, mapEffects.tsx, mapUtils.ts
MapPageView.tsx, map.css
```

**GetFeatureInfo endpoints** (11 WMS + 2 REST, defined in `config/featureInfoEndpoints.ts` + `hooks/useFeatureInfo.ts`):

- NVE: Flomsone 50/100/200, Skred 100, Kvikkleire (all `application/geo+json`, v1.3.0)
- NGU: Radon (`application/vnd.ogc.gml`, v1.1.0), Løsmasser (`application/vnd.ogc.gml`, v1.1.0), Berggrunn (`application/vnd.ogc.gml`, v1.1.0)
- Bane NOR: Støy jernbane (`application/vnd.ogc.gml`, v1.3.0)
- Forsvaret: Støy militær (`text/plain`, v1.3.0)
- Geonorge: Teiger/Matrikkel (`text/plain`, v1.3.0)
- REST: Riksantikvaren kulturminner (ArcGIS MapServer), Miljødirektoratet støy veg (ArcGIS MapServer)

**5-tab layout**:

- **Eiendommer**: Property table, screenshot preview
- **Generelt**: Matrikkel data (future: reguleringsplaner, kommuneplaner, kommunedelplaner)
- **Klima**: Flomsoner (50/100/200), Skredfare, Kvikkleire
- **Risiko**: Radon (NGU), Grunnforhold (Løsmasser + Berggrunn)
- **Miljø**: Kulturminner (Riksantikvaren), Støysoner (veg + jernbane + militær) (future: naturvern, forurenset grunn)

**Next steps**: Implement remaining Phase 6 sources (A5, A6, A8). Then Phase 7: B1 (PDF report), E1 (keyboard nav), B3 (share link), C2 (scoring badges), F1 (SwecoGPT).

**Design system**: Tailwind v4, `@custom-variant dark` with `[data-theme="dark"]`. Green accent: `#538840`/`#87be73`. Sweco tablist pattern. `safeParse()` wrapper for all parsers. `fetchJsonWithRetry`/`fetchTextWithRetry` with exponential backoff.

---
