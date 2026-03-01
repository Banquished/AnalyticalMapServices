---
title: "ADR-003: GML over Text/Plain for NGU WMS Services"
status: Accepted
project: NO-Ask
author: NOASOL
date: 2026-02-27
---

## Status

Accepted

## Context

NGU (Norges Geologiske Undersøkelse) operates WMS services for Radon, Løsmasser (loose deposits), and Berggrunn (bedrock). These services support multiple `GetFeatureInfo` response formats:

- `text/plain` — Human-readable text
- `application/vnd.ogc.gml` — OGC Geography Markup Language (XML)

During Phase 5 implementation, we discovered that **NGU's `text/plain` format does not include feature attributes** — it returns only the Feature ID (e.g., `Feature 12345`). This made it impossible to extract radon aktsomhet levels, soil types, or bedrock classifications from text/plain responses.

Testing with `application/vnd.ogc.gml` revealed that the GML format includes all feature attributes as XML elements (e.g., `<aktsomhetgrad>`, `<jord_type>`, `<bergart>`), but empty XML wrappers are returned when no feature exists at the query location.

## Decision

We will use `application/vnd.ogc.gml` as the `INFO_FORMAT` for all NGU WMS GetFeatureInfo queries (Radon, Løsmasser, Berggrunn).

Parsers will:

1. Strip XML namespace prefixes for reliable element matching
2. Detect empty GML wrappers (no `<gml:featureMember>` or `<msGMLOutput>` content) and return `null`
3. Extract attributes via simple string matching (regex on element tags), avoiding a full XML parser dependency
4. Wrap all parsing in `safeParse()` to gracefully handle unexpected formats

## Consequences

### Positive

- **Full attribute access**: All classification data (aktsomhetgrad, jord_type, bergart, etc.) is available
- **Consistent format**: Same GML parsing approach for all 3 NGU services
- **No-data detection**: Empty GML wrappers are reliably detected → UI shows "Ingen data tilgjengelig"

### Negative

- **XML parsing complexity**: GML is more complex than text/plain — mitigation: regex-based extraction is sufficient for the flat attribute structures NGU returns
- **Larger response payloads**: GML is ~3× larger than text/plain — mitigation: responses are typically < 5KB, negligible impact

### Neutral

- If NGU fixes their text/plain format in the future, we could switch back, but there's no benefit since GML works reliably

## Alternatives Considered

### Alternative A: text/plain with heuristic parsing

Attempt to extract data from the limited text/plain output. Rejected because the format literally doesn't contain the attributes we need.

### Alternative B: application/json (where available)

Some NGU services advertise JSON support but return malformed or empty JSON in practice. Rejected due to unreliable implementation on NGU's side.
