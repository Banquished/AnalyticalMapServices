/**
 * Business logic that orchestrates cross-API property lookups.
 *
 * All upstream HTTP calls go through the backend API (/api/v1/...).
 * Orchestration logic (multi-step flows) remains here in the frontend.
 *
 * Three main flows:
 *   1. Address search  → Geonorge → coordinates → Kartverket /punkt/omrader → polygons
 *   2. Matrikkel search → Kartverket /geokoding?omrade=true → polygons
 *   3. Map click (lat/lng) → Kartverket /punkt/omrader + optional Geonorge address
 */

import { z } from "zod";
import {
	GeokodingGeoJsonSchema,
	GeoKodingResponsSchema,
	OutputAdresseListSchema,
	OutputGeoPointListSchema,
} from "../api/schemas";
import type {
	OutputAdresse,
	OutputAdresseList,
	OutputGeoPoint,
	OutputGeoPointList,
} from "../api/types";
import { parseMatrikkelText } from "./matrikkelParser";
import type {
	Address,
	LatLng,
	Property,
	PropertyLookupResult,
	SearchQuery,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ADDRESS_LOOKUP_RADIUS_M = 50;
const CLICK_LOOKUP_RADIUS_M = 100;
const REVERSE_GEOCODE_RADIUS_M = 200;
const SINGLE_RESULT = 1;
const ADDRESS_SEARCH_RESULTS = 5;

/* ------------------------------------------------------------------ */
/*  Backend fetch helpers                                               */
/* ------------------------------------------------------------------ */

async function backendGet(path: string, params: Record<string, string | number | boolean | undefined>): Promise<unknown> {
	const url = new URL(path, window.location.origin);
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== "") {
			url.searchParams.set(key, String(value));
		}
	}
	const response = await fetch(url.toString());
	if (!response.ok) {
		const text = await response.text().catch(() => response.statusText);
		throw new Error(`API error (${response.status}): ${text.slice(0, 200)}`);
	}
	return response.json();
}

async function searchAddresses(params: Record<string, string | number | boolean | undefined>): Promise<OutputAdresseList> {
	const raw = await backendGet("/api/v1/addresses/search", params);
	return OutputAdresseListSchema.parse(raw);
}

async function searchAddressesByPoint(params: { lat: number; lon: number; radius: number; treffPerSide?: number }): Promise<OutputGeoPointList> {
	const raw = await backendGet("/api/v1/addresses/reverse", params);
	return OutputGeoPointListSchema.parse(raw);
}

async function getGeokoding(params: Record<string, string | number | boolean | undefined>): Promise<z.infer<typeof GeoKodingResponsSchema>> {
	const raw = await backendGet("/api/v1/properties/geokoding", params);
	return GeoKodingResponsSchema.parse(raw);
}

async function getPropertyAreasByPoint(params: { ost: number; nord: number; koordsys?: number; radius?: number; utkoordsys?: number }): Promise<z.infer<typeof GeoKodingResponsSchema>> {
	const raw = await backendGet("/api/v1/properties/areas", params);
	return GeoKodingResponsSchema.parse(raw);
}

/* ------------------------------------------------------------------ */
/*  Mappers: API responses → domain models                             */
/* ------------------------------------------------------------------ */

function mapGeonorgeAddress(a: OutputAdresse | OutputGeoPoint): Address {
	return {
		addressText: a.adressetekst,
		streetName: a.adressenavn,
		number: a.nummer,
		letter: a.bokstav,
		postalCode: a.postnummer,
		postalPlace: a.poststed,
		municipalityNumber: a.kommunenummer,
		municipalityName: a.kommunenavn,
		position: {
			lat: a.representasjonspunkt.lat,
			lng: a.representasjonspunkt.lon,
		},
		matrikkelId: {
			kommunenummer: a.kommunenummer,
			gardsnummer: a.gardsnummer,
			bruksnummer: a.bruksnummer,
			festenummer: a.festenummer,
		},
	};
}

function mapKartverketFeature(feature: z.infer<typeof GeokodingGeoJsonSchema>): Property {
	const p = feature.properties;
	const geom = feature.geometry;

	let position: LatLng;
	let areaGeometry: number[][][][] | undefined;

	if (geom.type === "MultiPolygon") {
		const polygons = geom.coordinates as number[][][][];
		areaGeometry = polygons;
		const outer = polygons[0]?.[0];
		if (outer && outer.length > 0) {
			const sumLng = outer.reduce((s, c) => s + c[0], 0);
			const sumLat = outer.reduce((s, c) => s + c[1], 0);
			position = { lat: sumLat / outer.length, lng: sumLng / outer.length };
		} else {
			position = { lat: 0, lng: 0 };
		}
	} else if (geom.type === "Polygon") {
		const rings = geom.coordinates as number[][][];
		areaGeometry = [rings];
		const outer = rings[0];
		if (outer && outer.length > 0) {
			const sumLng = outer.reduce((s, c) => s + c[0], 0);
			const sumLat = outer.reduce((s, c) => s + c[1], 0);
			position = { lat: sumLat / outer.length, lng: sumLng / outer.length };
		} else {
			position = { lat: 0, lng: 0 };
		}
	} else {
		const coords = geom.coordinates as number[];
		position = { lat: coords[1], lng: coords[0] };
	}

	return {
		matrikkelId: {
			kommunenummer: p.kommunenummer,
			gardsnummer: p.gardsnummer,
			bruksnummer: p.bruksnummer,
			festenummer: p.festenummer,
			seksjonsnummer: p.seksjonsnummer,
		},
		matrikkelText: p.matrikkelnummertekst,
		position,
		distanceMetres: p.meterFraPunkt,
		areaGeometry,
	};
}

/* ------------------------------------------------------------------ */
/*  Flow 1: Address search                                             */
/* ------------------------------------------------------------------ */

export async function lookupByAddress(text: string): Promise<PropertyLookupResult> {
	const addressResult = await searchAddresses({
		sok: text,
		treffPerSide: ADDRESS_SEARCH_RESULTS,
	});

	if (addressResult.adresser.length === 0) {
		return { properties: [] };
	}

	const topAddress = addressResult.adresser[0];
	const address = mapGeonorgeAddress(topAddress);

	const areaResult = await getPropertyAreasByPoint({
		nord: address.position.lat,
		ost: address.position.lng,
		koordsys: 4258,
		radius: ADDRESS_LOOKUP_RADIUS_M,
		utkoordsys: 4258,
	});

	const allProperties = areaResult.features.map((f) => {
		const prop = mapKartverketFeature(f);
		prop.address = address;
		return prop;
	});

	const matched = allProperties.find(
		(p) =>
			p.matrikkelId.kommunenummer === address.matrikkelId.kommunenummer &&
			p.matrikkelId.gardsnummer === address.matrikkelId.gardsnummer &&
			p.matrikkelId.bruksnummer === address.matrikkelId.bruksnummer,
	);

	const properties = matched ? [matched] : allProperties.slice(0, 1);
	return { properties, address };
}

/* ------------------------------------------------------------------ */
/*  Flow 2: Matrikkel search                                           */
/* ------------------------------------------------------------------ */

export async function lookupByMatrikkel(text: string): Promise<PropertyLookupResult> {
	const parsed = parseMatrikkelText(text);
	if (!parsed) {
		throw new Error(
			"Ugyldig matrikkelformat. Bruk f.eks. «Bergen 33/2» eller «4601 33/2».",
		);
	}

	let kommunenummer: string;

	if (/^\d{4}$/.test(parsed.kommune)) {
		kommunenummer = parsed.kommune;
	} else {
		const addrResult = await searchAddresses({
			kommunenavn: parsed.kommune,
			gardsnummer: parsed.gnr,
			bruksnummer: parsed.bnr,
			treffPerSide: SINGLE_RESULT,
		});

		if (addrResult.adresser.length > 0) {
			kommunenummer = addrResult.adresser[0].kommunenummer;
		} else {
			const fallback = await searchAddresses({
				kommunenavn: parsed.kommune,
				treffPerSide: SINGLE_RESULT,
			});
			if (fallback.adresser.length === 0) {
				throw new Error(`Fant ingen kommune med navn «${parsed.kommune}».`);
			}
			kommunenummer = fallback.adresser[0].kommunenummer;
		}
	}

	const result = await getGeokoding({
		kommunenummer,
		gardsnummer: parsed.gnr,
		bruksnummer: parsed.bnr,
		omrade: true,
		utkoordsys: 4258,
	});

	if (result.features.length === 0) {
		return { properties: [] };
	}

	const properties: Property[] = result.features.map(mapKartverketFeature);

	const topProperty = properties[0];
	let address: Address | undefined;
	try {
		const addrResult = await searchAddressesByPoint({
			lat: topProperty.position.lat,
			lon: topProperty.position.lng,
			radius: ADDRESS_LOOKUP_RADIUS_M,
			treffPerSide: SINGLE_RESULT,
		});
		if (addrResult.adresser.length > 0) {
			address = mapGeonorgeAddress(addrResult.adresser[0]);
			topProperty.address = address;
		}
	} catch {
		// Address may not exist — that's fine
	}

	return { properties, address };
}

/* ------------------------------------------------------------------ */
/*  Flow 3: Map click (coordinates)                                    */
/* ------------------------------------------------------------------ */

export async function lookupByCoordinates(point: LatLng): Promise<PropertyLookupResult> {
	const areaResult = await getPropertyAreasByPoint({
		nord: point.lat,
		ost: point.lng,
		koordsys: 4258,
		radius: CLICK_LOOKUP_RADIUS_M,
		utkoordsys: 4258,
	});

	const properties = areaResult.features.map(mapKartverketFeature);

	let address: Address | undefined;
	try {
		const addrResult = await searchAddressesByPoint({
			lat: point.lat,
			lon: point.lng,
			radius: REVERSE_GEOCODE_RADIUS_M,
			treffPerSide: SINGLE_RESULT,
		});
		if (addrResult.adresser.length > 0) {
			address = mapGeonorgeAddress(addrResult.adresser[0]);
			if (properties.length > 0) {
				properties[0].address = address;
			}
		}
	} catch {
		// No address available
	}

	return { properties, address };
}

/* ------------------------------------------------------------------ */
/*  Unified dispatcher                                                 */
/* ------------------------------------------------------------------ */

export async function lookupProperty(query: SearchQuery): Promise<PropertyLookupResult> {
	switch (query.type) {
		case "address":
			return lookupByAddress(query.text);
		case "matrikkel":
			return lookupByMatrikkel(query.text);
		case "coordinates":
			return lookupByCoordinates({ lat: query.lat, lng: query.lng });
	}
}
