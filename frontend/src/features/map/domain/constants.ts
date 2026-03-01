/**
 * Shared constants for the map feature.
 * Extracted from propertySelection.store.ts — Phase 4.1.5
 */

/* ------------------------------------------------------------------ */
/*  Sweco colour palette for per-property polygon colouring             */
/* ------------------------------------------------------------------ */

export const PROPERTY_COLOURS = [
	{ fillColor: "#87be73", color: "#538840" }, // green
	{ fillColor: "#98bddc", color: "#3a7dbf" }, // blue
	{ fillColor: "#de845d", color: "#874c33" }, // peach
	{ fillColor: "#c6b37c", color: "#989077" }, // sand
	{ fillColor: "#bde3af", color: "#3f6730" }, // green-300 / 900
	{ fillColor: "#d6e4f1", color: "#293c53" }, // blue-300 / 900
] as const;

export type PropertyColour = (typeof PROPERTY_COLOURS)[number];
