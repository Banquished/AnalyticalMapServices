/**
 * Zod schemas for runtime validation of API responses.
 *
 * OutputAdresseList and GeoKodingRespons are fully typed.
 * FeatureInfoData validates the top-level shape; nested domain objects
 * use z.record / z.unknown to avoid duplicating the full type tree.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Geonorge Adresser — OutputAdresseList                             */
/* ------------------------------------------------------------------ */

const GeomPointSchema = z.object({
	epsg: z.string(),
	lat: z.number(),
	lon: z.number(),
});

const OutputAdresseSchema = z.object({
	adressenavn: z.string(),
	adressetekst: z.string(),
	adressetilleggsnavn: z.string().nullish().transform(v => v ?? undefined),
	adressekode: z.number(),
	nummer: z.number(),
	bokstav: z.string().nullish().transform(v => v ?? undefined),
	kommunenummer: z.string(),
	kommunenavn: z.string(),
	gardsnummer: z.number(),
	bruksnummer: z.number(),
	festenummer: z.number().nullish().transform(v => v ?? undefined),
	undernummer: z.number().nullish().transform(v => v ?? undefined),
	bruksenhetsnummer: z.array(z.string()).nullish().transform(v => v ?? undefined),
	objtype: z.enum(["Vegadresse", "Matrikkeladresse"]),
	poststed: z.string(),
	postnummer: z.string(),
	adressetekstutenadressetilleggsnavn: z.string(),
	stedfestingverifisert: z.boolean(),
	representasjonspunkt: GeomPointSchema,
	oppdateringsdato: z.string(),
});

const GeonorgeMetadataSchema = z.object({
	asciiKompatibel: z.boolean(),
	totaltAntallTreff: z.number(),
	viserFra: z.number(),
	viserTil: z.number(),
	sokeStreng: z.string(),
	side: z.number(),
	treffPerSide: z.number(),
});

export const OutputAdresseListSchema = z.object({
	metadata: GeonorgeMetadataSchema,
	adresser: z.array(OutputAdresseSchema),
});

export const OutputGeoPointListSchema = z.object({
	metadata: GeonorgeMetadataSchema,
	adresser: z.array(OutputAdresseSchema.extend({ meterDistanseTilPunkt: z.number() })),
});

/* ------------------------------------------------------------------ */
/*  GeoKodingRespons                                                   */
/* ------------------------------------------------------------------ */

const GeokodingPropertiesSchema = z.object({
	kommunenummer: z.string(),
	gardsnummer: z.number(),
	bruksnummer: z.number(),
	festenummer: z.number().nullish().transform(v => v ?? undefined),
	seksjonsnummer: z.number().nullish().transform(v => v ?? undefined),
	matrikkelnummertekst: z.string(),
	lokalid: z.number(),
	objekttype: z.string(),
	oppdateringsdato: z.string(),
	hovedområde: z.boolean().nullish().transform(v => v ?? undefined),
	nøyaktighetsklasseteig: z.string().nullish().transform(v => v ?? undefined),
	teigmedflerematrikkelenheter: z.boolean().nullish().transform(v => v ?? undefined),
	uregistrertjordsameie: z.boolean().nullish().transform(v => v ?? undefined),
	meterFraPunkt: z.number().nullish().transform(v => v ?? undefined),
});

export const GeokodingGeoJsonSchema = z.object({
	type: z.string(),
	geometry: z.object({
		type: z.string(),
		coordinates: z.unknown(),
	}),
	properties: GeokodingPropertiesSchema,
});

export const GeoKodingResponsSchema = z.object({
	type: z.string(),
	crs: z
		.object({
			type: z.string(),
			properties: z.object({ name: z.string() }),
		})
		.optional(),
	features: z.array(GeokodingGeoJsonSchema),
});

/* ------------------------------------------------------------------ */
/*  FeatureInfoData — top-level structural validation                  */
/*  Inner domain objects are complex; use passthrough for safety.      */
/* ------------------------------------------------------------------ */

export const FeatureInfoDataSchema = z.object({
	klima: z.record(z.string(), z.unknown()).nullable(),
	risiko: z.record(z.string(), z.unknown()).nullable(),
	generelt: z.record(z.string(), z.unknown()).nullable(),
	fetchedAt: z.number(),
});
