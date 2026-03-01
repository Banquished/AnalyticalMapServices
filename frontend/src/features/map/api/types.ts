/**
 * Shared API response/request types for Kartverket and Geonorge APIs.
 *
 * These types mirror the upstream OpenAPI schemas and are intentionally
 * framework-agnostic so the same shapes can be re-used in a Python/FastAPI
 * backend later.
 */

/* ------------------------------------------------------------------ */
/*  Kartverket Eiendom API  (https://api.kartverket.no/eiendom/v1)    */
/* ------------------------------------------------------------------ */

/** Coordinate pair: [longitude, latitude] or nested polygon/multi-polygon rings. */
export type GeoJsonCoordinates = {
	type: string;
	coordinates: number[] | number[][] | number[][][] | number[][][][];
};

export type GeojsonEpsg = {
	name: string;
};

export type GeojsonCrs = {
	type: string;
	properties: GeojsonEpsg;
};

export type Representasjonspunkt = {
	koordsys: number;
	nord: number;
	øst: number;
};

export type GeokodingProperties = {
	kommunenummer: string;
	gardsnummer: number;
	bruksnummer: number;
	festenummer?: number;
	seksjonsnummer?: number;
	matrikkelnummertekst: string;
	lokalid: number;
	objekttype: string;
	oppdateringsdato: string;
	hovedområde?: boolean;
	nøyaktighetsklasseteig?: string;
	teigmedflerematrikkelenheter?: boolean;
	uregistrertjordsameie?: boolean;
	meterFraPunkt?: number;
};

export type GeokodingGeoJson = {
	type: string;
	geometry: GeoJsonCoordinates;
	properties: GeokodingProperties;
};

export type KartverketMetadata = {
	sokeStreng: string;
	totaltAntallTreff: number;
	treffPerSide: number;
	side: number;
	viserFra: number;
	viserTil: number;
};

/** Response from /geokoding and /punkt/omrader */
export type GeoKodingRespons = {
	type: string;
	crs?: GeojsonCrs;
	features: GeokodingGeoJson[];
};

export type PunktEiendom = {
	kommunenummer: string;
	gardsnummer: number;
	bruksnummer: number;
	festenummer?: number;
	seksjonsnummer?: number;
	matrikkelnummertekst: string;
	lokalid: number;
	objekttype: string;
	oppdateringsdato: string;
	representasjonspunkt: Representasjonspunkt;
	hovedområde?: boolean;
	nøyaktighetsklasseteig?: string;
	teigmedflerematrikkelenheter?: boolean;
	uregistrertjordsameie?: boolean;
	meterFraPunkt?: number;
};

/** Response from /punkt */
export type PunktRespons = {
	metadata: KartverketMetadata;
	eiendom: PunktEiendom[];
};

/* ------------------------------------------------------------------ */
/*  Geonorge Adresser API  (https://ws.geonorge.no/adresser/v1)       */
/* ------------------------------------------------------------------ */

export type GeomPoint = {
	epsg: string;
	lat: number;
	lon: number;
};

export type OutputAdresse = {
	adressenavn: string;
	adressetekst: string;
	adressetilleggsnavn?: string;
	adressekode: number;
	nummer: number;
	bokstav?: string;
	kommunenummer: string;
	kommunenavn: string;
	gardsnummer: number;
	bruksnummer: number;
	festenummer?: number;
	undernummer?: number;
	bruksenhetsnummer?: string[];
	objtype: "Vegadresse" | "Matrikkeladresse";
	poststed: string;
	postnummer: string;
	adressetekstutenadressetilleggsnavn: string;
	stedfestingverifisert: boolean;
	representasjonspunkt: GeomPoint;
	oppdateringsdato: string;
};

export type GeonorgeMetadata = {
	asciiKompatibel: boolean;
	totaltAntallTreff: number;
	viserFra: number;
	viserTil: number;
	sokeStreng: string;
	side: number;
	treffPerSide: number;
};

/** Response from /sok */
export type OutputAdresseList = {
	metadata: GeonorgeMetadata;
	adresser: OutputAdresse[];
};

export type OutputGeoPoint = OutputAdresse & {
	meterDistanseTilPunkt: number;
};

/** Response from /punktsok */
export type OutputGeoPointList = {
	metadata: GeonorgeMetadata;
	adresser: OutputGeoPoint[];
};
