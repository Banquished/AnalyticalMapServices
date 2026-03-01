/**
 * Property selection strategy — decides whether a click result
 * should auto-select the nearest property or require disambiguation.
 *
 * Framework-agnostic pure logic.
 */

import type { Property, PropertyLookupResult } from "./types";

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

/** Distance threshold (metres) — below this, auto-select the nearest. */
export const AUTO_SELECT_DISTANCE_THRESHOLD = 50;

/** Max candidates shown in the disambiguation picker. */
export const MAX_PICKER_CANDIDATES = 8;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SelectionDecision =
	| { kind: "auto"; property: Property }
	| { kind: "disambiguate"; candidates: Property[] }
	| { kind: "empty" };

/* ------------------------------------------------------------------ */
/*  Logic                                                              */
/* ------------------------------------------------------------------ */

/**
 * Given a lookup result from a map click, decide whether to auto-select
 * or show a disambiguation picker.
 *
 * @param result     The raw PropertyLookupResult from lookupByCoordinates
 * @param forcePicke If true (e.g. Shift held), always show picker
 */
export function decideSelection(
	result: PropertyLookupResult,
	forcePicker = false,
): SelectionDecision {
	const { properties } = result;

	if (properties.length === 0) {
		return { kind: "empty" };
	}

	// Sort by distance (nearest first) — properties without distance go last
	const sorted = [...properties].sort((a, b) => {
		const da = a.distanceMetres ?? Number.MAX_SAFE_INTEGER;
		const db = b.distanceMetres ?? Number.MAX_SAFE_INTEGER;
		return da - db;
	});

	const nearest = sorted[0];
	const nearestDistance = nearest.distanceMetres ?? 0;

	// If force-picker (modifier key) or distance above threshold → disambiguate
	if (forcePicker) {
		return {
			kind: "disambiguate",
			candidates: sorted.slice(0, MAX_PICKER_CANDIDATES),
		};
	}

	// Only one result or very close → auto-select
	if (
		sorted.length === 1 ||
		nearestDistance <= AUTO_SELECT_DISTANCE_THRESHOLD
	) {
		return { kind: "auto", property: nearest };
	}

	// Multiple results and nearest is far → disambiguate
	return {
		kind: "disambiguate",
		candidates: sorted.slice(0, MAX_PICKER_CANDIDATES),
	};
}
