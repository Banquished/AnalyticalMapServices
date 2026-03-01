---
title: "ADR-006: Five-Tab Panel Layout"
status: Accepted
project: NO-Ask
author: NOASOL
date: 2026-02-27
---

## Status

Accepted

## Context

After implementing Løsmasser, Berggrunn, Kulturminner, and Støysoner in Phase 6, the original 4-tab layout (Eiendommer, Generelt, Klima, Risiko) became problematic:

1. **Risiko tab overloaded**: Contained 6+ sections — Radon, Kvikkleire, Løsmasser, Berggrunn, Kulturminner (up to 52 items near Gjøvik), and Støysoner (3 sub-sources). Users had to scroll extensively.
2. **Klima tab too sparse**: Only 4 rows (Flom 50/100/200 + Skredfare). Felt empty compared to the packed Risiko tab.
3. **Semantic mismatches**: Kulturminner (cultural heritage) and Støysoner (noise) don't belong under "Risk" — they're environmental/regulatory data. Kvikkleire (quick clay) is a natural hazard, semantically closer to flood/landslide than to radon.

Three options were evaluated:

1. Keep 4 tabs, improve scrolling/collapsibility
2. Add a 5th tab "Regulering" for regulatory data
3. Add a 5th tab "Miljø" for environmental data

## Decision

We will adopt a **5-tab layout**:

| Tab | Content | Rationale |
|-----|---------|-----------|
| **Eiendommer** | Property table, screenshot preview | Unchanged |
| **Generelt** | Matrikkel data; future: reguleringsplaner, kommuneplaner, kommunedelplaner | Reserved for planning/regulatory data as APIs become available |
| **Klima** | Flomsoner (50/100/200), Skredfare, Kvikkleire | Natural hazards grouped together — kvikkleire moved here from Risiko |
| **Risiko** | Radon (NGU), Grunnforhold (Løsmasser + Berggrunn) | Geological risk assessment only |
| **Miljø** | Kulturminner (Riksantikvaren), Støysoner (veg + jernbane + militær); future: Naturvernområder, Forurenset grunn | Environmental and cultural heritage data |

**Implementation**:

- Created `MiljoTab.tsx` with kulturminner (compact cards, expand/collapse) + støysoner sections
- Stripped `RisikoTab.tsx` to radon + grunnforhold only
- Updated `KlimaTab.tsx` with kvikkleire prop
- Added 5th tab to `MapPageView.tsx` with `MiljoTab` import and data routing
- Domain types unchanged — tab reorganization is purely at the UI layer

## Consequences

### Positive

- **Balanced tabs**: Each tab has 3–6 sections (vs. 6+ crammed into Risiko before)
- **Semantic clarity**: Natural hazards in Klima, geology in Risiko, environment in Miljø
- **Scalable**: Miljø tab has room for Naturvernområder and Forurenset grunn without overloading
- **Generelt reserved**: Planning/zoning data (Kommuneplan, Reguleringsplan) has a natural home when APIs become available
- **No domain changes**: Types and parsers unchanged — reorganization is purely UI-level

### Negative

- **5 tabs = more clicks**: Users must navigate one more tab — mitigation: tabs are compact (Sweco `tablist-sm`) and data is logically grouped
- **Screen real estate on mobile**: 5 tabs may need horizontal scroll on small screens — mitigation: current deployment target is desktop consultants

### Neutral

- The tab bar uses Sweco's `tablist tablist-sm` pattern which supports any number of tabs via horizontal layout

## Alternatives Considered

### Alternative A: Keep 4 tabs with collapsible sections

Add expand/collapse to each section in the Risiko tab. Rejected because 52 kulturminner items + 3 støy sources + 6 existing sections creates overwhelming cognitive load even when collapsed.

### Alternative B: Add "Regulering" tab instead of "Miljø"

Move Kulturminner to a "Regulering" tab (since heritage restrictions affect building permits). Rejected because "Generelt" is already planned for regulatory data (kommuneplan, reguleringsplan), and creating two regulatory tabs would be confusing.
