/**
 * Domain models for the map feature.
 *
 * These types represent the *application's* view of addresses and properties,
 * decoupled from any specific API response shape. The domain layer maps
 * API responses into these types so the UI never couples to upstream schemas.
 */

/** A geographic point in WGS84 (EPSG:4258 / 4326). */
export type LatLng = {
	lat: number;
	lng: number;
};

/** Matrikkel identity — the Norwegian property identifier. */
export type MatrikkelId = {
	kommunenummer: string;
	gardsnummer: number;
	bruksnummer: number;
	festenummer?: number;
	seksjonsnummer?: number;
};

/** A resolved property with optional address and geometry. */
export type Property = {
	matrikkelId: MatrikkelId;
	/** Human-readable matrikkel string, e.g. "1201-33/2" */
	matrikkelText: string;
	position: LatLng;
	/** Distance from the search point in metres (if applicable) */
	distanceMetres?: number;
	/** Address info — may be absent for undeveloped land, roads, etc. */
	address?: Address;
	/** GeoJSON polygon coordinates in normalised MultiPolygon shape:
	 *  number[][][][] = array of polygons, each polygon is array of rings,
	 *  each ring is array of [lng, lat] coordinate pairs.
	 *
	 *  Legacy data (pre-2.1) may still be number[][][] (single Polygon);
	 *  consumers must handle both depths gracefully.
	 */
	areaGeometry?: number[][][][] | number[][][];
};

/** A resolved address from Geonorge. */
export type Address = {
	/** Full address string, e.g. "Fantoftveien 18P" */
	addressText: string;
	streetName: string;
	number?: number;
	letter?: string;
	postalCode: string;
	postalPlace: string;
	municipalityNumber: string;
	municipalityName: string;
	position: LatLng;
	matrikkelId: MatrikkelId;
};

/** The user can search by free-text address or by matrikkel. */
export type SearchQuery =
	| { type: "address"; text: string }
	| { type: "matrikkel"; text: string }
	| { type: "coordinates"; lat: number; lng: number };

/** Result of any property lookup operation. */
export type PropertyLookupResult = {
	properties: Property[];
	address?: Address;
};

/** Info about a map click, including modifier keys for disambiguation. */
export type MapClickEvent = {
	point: LatLng;
	/** Screen-space click position for anchoring the picker popover */
	screenPoint: { x: number; y: number };
	shiftKey: boolean;
	ctrlKey: boolean;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Unique key string for deduplication: "kommune-gnr/bnr(/fnr)" */
export function matrikkelKey(p: Property): string {
	const { kommunenummer, gardsnummer, bruksnummer, festenummer } =
		p.matrikkelId;
	const base = `${kommunenummer}-${gardsnummer}/${bruksnummer}`;
	return festenummer != null ? `${base}/${festenummer}` : base;
}
