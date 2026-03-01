/**
 * Matrikkel text parsers — shared between search typeahead and lookup flows.
 * Framework-agnostic — pure TypeScript functions.
 *
 * Extracted from MapSearchControl.tsx + propertyLookup.ts — Phase 4.1.3
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Result of parsing a partial matrikkel string (for typeahead). */
export type PartialMatrikkel = {
	kommune: string;
	gnr?: number;
	bnr?: number;
};

/** Result of parsing a complete matrikkel string (for lookup). */
export type FullMatrikkel = {
	kommune: string;
	gnr: number;
	bnr: number;
};

/* ------------------------------------------------------------------ */
/*  parsePartialMatrikkel — tolerant, for typeahead suggestions         */
/* ------------------------------------------------------------------ */

/**
 * Parse partial matrikkel input for typeahead queries.
 * Accepts many forms:
 *   "Bergen 33/2"   → { kommune: "Bergen", gnr: 33, bnr: 2 }
 *   "33/2 Bergen"   → { kommune: "Bergen", gnr: 33, bnr: 2 }
 *   "Bergen 33/"    → { kommune: "Bergen", gnr: 33 }
 *   "Bergen 33"     → { kommune: "Bergen", gnr: 33 }
 *   "Bergen"        → { kommune: "Bergen" }
 *   "4601 33/2"     → { kommune: "4601",  gnr: 33, bnr: 2 }
 */
export function parsePartialMatrikkel(text: string): PartialMatrikkel {
	// Full gnr/bnr: "Bergen 33/2"
	const withBnr = text.match(/(\d+)\s*\/\s*(\d+)/);
	if (withBnr) {
		return {
			kommune: text.replace(withBnr[0], "").trim(),
			gnr: parseInt(withBnr[1], 10),
			bnr: parseInt(withBnr[2], 10),
		};
	}
	// gnr with trailing slash, no bnr yet: "Bergen 33/"
	const withSlash = text.match(/(\d+)\s*\/\s*$/);
	if (withSlash) {
		return {
			kommune: text.replace(withSlash[0], "").trim(),
			gnr: parseInt(withSlash[1], 10),
		};
	}
	// Trailing number (likely gnr): "Bergen 33"
	const trailing = text.match(/\s(\d+)$/);
	if (trailing) {
		return {
			kommune: text.replace(trailing[0], "").trim(),
			gnr: parseInt(trailing[1], 10),
		};
	}
	return { kommune: text };
}

/* ------------------------------------------------------------------ */
/*  parseMatrikkelText — strict, for final lookup                      */
/* ------------------------------------------------------------------ */

/**
 * Parse free-text matrikkel input like "Bergen 33/2" or "33/2 Bergen".
 * Also accepts numeric kommunenummer: "4601 33/2".
 * Returns null if not a valid full matrikkel string (requires gnr AND bnr).
 */
export function parseMatrikkelText(text: string): FullMatrikkel | null {
	const m = text.match(/(\d+)\s*\/\s*(\d+)/);
	if (!m) return null;
	const gnr = parseInt(m[1], 10);
	const bnr = parseInt(m[2], 10);
	const rest = text.replace(m[0], "").trim();
	if (!rest) return null;
	return { kommune: rest, gnr, bnr };
}
