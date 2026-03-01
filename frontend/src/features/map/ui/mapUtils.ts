import L from "leaflet";

/* ------------------------------------------------------------------ */
/*  FontAwesome-based Leaflet divIcon (no CDN, no tracking warnings)   */
/*  Extracted from MapView.tsx — Phase 4.1.2                           */
/* ------------------------------------------------------------------ */

export const faLocationIcon = L.divIcon({
	html: '<i class="fa-solid fa-location-dot text-green-700 dark:text-green-300" style="font-size:28px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))"></i>',
	className: "", // remove Leaflet's default white-box
	iconSize: [28, 28],
	iconAnchor: [14, 28],
	popupAnchor: [0, -28],
});

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Convert GeoJSON [lng, lat] polygon geometry → Leaflet [lat, lng].
 *
 *  Accepts both formats:
 *    - number[][][][]  (MultiPolygon / normalised shape from 2.1+)
 *    - number[][][]    (legacy Polygon shape, e.g. persisted store data)
 *
 *  Auto-detects the depth by checking whether the innermost value at
 *  geom[0][0][0] is a number (Polygon) or an array (MultiPolygon).
 */
export function geoJsonToLeafletPositions(
	geom: number[][][][] | number[][][],
): [number, number][][][] {
	// Detect: if geom[0][0][0] is a number, it's the legacy Polygon shape
	const first = geom[0]?.[0]?.[0];
	const isPolygon = typeof first === "number";

	const multi: number[][][][] = isPolygon
		? [geom as number[][][]] // wrap legacy Polygon → MultiPolygon
		: (geom as number[][][][]);

	return multi.map((polygon) =>
		polygon.map((ring) =>
			ring.map(([lng, lat]) => [lat, lng] as [number, number]),
		),
	);
}

/**
 * Compute the bounding box of property geometries (for fitBounds).
 * Returns undefined if no valid coordinates found.
 */
export function computeBounds(
	items: Array<{
		property: {
			position: { lat: number; lng: number };
			areaGeometry?: number[][][][] | number[][][];
		};
	}>,
): [[number, number], [number, number]] | undefined {
	let minLat = 90;
	let maxLat = -90;
	let minLng = 180;
	let maxLng = -180;

	for (const item of items) {
		const { lat, lng } = item.property.position;
		if (lat === 0 && lng === 0) continue;
		if (lat < minLat) minLat = lat;
		if (lat > maxLat) maxLat = lat;
		if (lng < minLng) minLng = lng;
		if (lng > maxLng) maxLng = lng;
		if (item.property.areaGeometry) {
			const first = item.property.areaGeometry[0]?.[0]?.[0];
			const multi: number[][][][] =
				typeof first === "number"
					? [item.property.areaGeometry as number[][][]]
					: (item.property.areaGeometry as number[][][][]);
			for (const polygon of multi) {
				for (const ring of polygon) {
					for (const [cLng, cLat] of ring) {
						if (cLat < minLat) minLat = cLat;
						if (cLat > maxLat) maxLat = cLat;
						if (cLng < minLng) minLng = cLng;
						if (cLng > maxLng) maxLng = cLng;
					}
				}
			}
		}
	}

	if (minLat > maxLat) return undefined;
	return [
		[minLat, minLng],
		[maxLat, maxLng],
	];
}
