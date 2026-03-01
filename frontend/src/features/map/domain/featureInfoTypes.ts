/**
 * Domain types for WMS GetFeatureInfo results.
 *
 * These types represent parsed, application-level analysis data
 * for properties — independent of the upstream WMS response format.
 */

/* ------------------------------------------------------------------ */
/*  Status indicator                                                    */
/* ------------------------------------------------------------------ */

/** Risk assessment status for display as pass/warn/fail rows. */
export type RiskStatus =
	| "pass"
	| "warn"
	| "fail"
	| "no-data"
	| "loading"
	| "error";

/** A single status row in a tab. */
export type StatusRow = {
	label: string;
	status: RiskStatus;
	detail: string;
	/** Source service name for attribution */
	source?: string;
};

/* ------------------------------------------------------------------ */
/*  Klima tab data                                                      */
/* ------------------------------------------------------------------ */

export type FloodZoneResult = {
	/** True if the property centroid falls within the flood zone */
	inZone: boolean;
	/** Detail text from the WMS response */
	detail: string;
};

export type KlimaData = {
	/** NVE Flomsoner — 50-year return period */
	flom50: FloodZoneResult | null;
	/** NVE Flomsoner — 100-year return period */
	flom100: FloodZoneResult | null;
	/** NVE Flomsoner — 200-year return period */
	flom200: FloodZoneResult | null;
	/** NVE Skredfaresoner — 100-year return period */
	skred100: FloodZoneResult | null;
};

/* ------------------------------------------------------------------ */
/*  Risiko tab data                                                     */
/* ------------------------------------------------------------------ */

export type RadonLevel = "lav" | "moderat" | "høy" | "usikker" | null;

/** NGU Løsmasser (loose deposits / quaternary geology) */
export type LosmasseData = {
	/** Soil type description (e.g. "Elve- og bekkeavsetning") */
	type: string;
	/** Detailed definition of the soil type */
	definition: string | null;
	/** Suitable map scale (e.g. "1 : 50 000") */
	scale: string | null;
};

/** NGU Berggrunn (bedrock geology) */
export type BerggrunData = {
	/** Primary rock type (e.g. "Tonalittisk gneis") */
	rockType: string;
	/** Geological unit description */
	unit: string | null;
	/** Tectonic classification */
	tectonicClassification: string | null;
	/** Metamorphic facies */
	metamorphicFacies: string | null;
	/** Formation age description */
	formationAge: string | null;
};

/** Riksantikvaren Kulturminner (cultural heritage sites) */
export type KulturminneItem = {
	/** Site name */
	name: string;
	/** Protection type (e.g. "Vedtaksfredet", "Statlig listeført") */
	protectionType: string | null;
	/** Category (e.g. "Bebyggelse-Infrastruktur") */
	category: string | null;
	/** Site type (e.g. "Jernbaneanlegg", "Gårdstun") */
	siteType: string | null;
	/** Original function */
	originalFunction: string | null;
	/** Protection law (e.g. "Kulturminneloven av 1978") */
	protectionLaw: string | null;
	/** Link to kulturminnesok.no detail page */
	link: string | null;
};

export type KulturminneData = {
	/** Number of cultural heritage sites found within radius */
	count: number;
	/** The individual sites (max ~20 nearest) */
	items: KulturminneItem[];
	/** True if any site is formally protected (fredet) */
	hasProtected: boolean;
};

/* ------------------------------------------------------------------ */
/*  Støysoner (noise zones) data                                        */
/* ------------------------------------------------------------------ */

/** A single road noise zone from Miljødirektoratet strategic mapping */
export type StoyVegItem = {
	/** Noise level band (e.g. "55-59 dB", "≥75 dB") */
	decibelRange: string;
	/** Raw category code (e.g. "Lden6569") */
	categoryCode: string;
	/** Data source description */
	source: string | null;
};

/** Jernbane (rail) noise zone from Bane NOR WMS */
export type StoyJernbaneItem = {
	/** True if the property is within a rail noise zone */
	inZone: boolean;
	/** Detail text from WMS response */
	detail: string;
};

/** Military/shooting range noise zone from Forsvaret WMS */
export type StoyMilitarItem = {
	/** Zone category code (e.g. "R" = rød, "G" = gul) */
	zoneCategory: string;
	/** Zone category label (e.g. "Rød sone", "Gul sone") */
	zoneCategoryLabel: string;
	/** Name of the noise source (e.g. "Rødsmoen og RØ") */
	sourceName: string | null;
	/** Additional info (e.g. "Inneholder tunge våpen") */
	info: string | null;
	/** Year the noise assessment was calculated */
	calculationYear: number | null;
};

/**
 * Data freshness metadata.
 * Used to warn users when data is potentially outdated.
 */
export type DataFreshness = {
	/** Year the data was collected/calculated (null = unknown) */
	dataYear: number | null;
	/** Human-readable source label */
	sourceLabel: string;
	/** True if the data is considered stale (>3 years old) */
	isStale: boolean;
};

/** Aggregated noise zone data from all sources */
export type StoyData = {
	/** Road traffic noise (Miljødirektoratet) — may have multiple zones */
	veg: StoyVegItem[] | null;
	/** Rail noise (Bane NOR) */
	jernbane: StoyJernbaneItem | null;
	/** Military/shooting range noise (Forsvaret) */
	militar: StoyMilitarItem | null;
	/** Data freshness info per source */
	freshness: DataFreshness[];
};

/** Miljødirektoratet Naturvernområder (protected nature areas) */
export type NaturvernItem = {
	/** Official protected area name */
	name: string;
	/** Protection form (e.g. "Nasjonalpark", "Naturreservat", "Landskapsvernområde") */
	verneform: string | null;
	/** Conservation plan (e.g. "Verneplan for myr", "Skogvern") */
	verneplan: string | null;
	/** Date of formal protection (formatted string, e.g. "01.01.1975") */
	vernedato: string | null;
	/** Ecosystem type ("Marin", "Terrestrisk", "Marin og terrestrisk") */
	majorEcosystemType: string | null;
	/** IUCN protection category (e.g. "IUCN IA", "IUCN II") */
	iucn: string | null;
	/** URL to faktaark on naturbase.no */
	faktaark: string | null;
};

export type NaturvernData = {
	/** Number of protected areas the property falls within */
	count: number;
	/** The individual areas */
	items: NaturvernItem[];
	/** True if any area is strictly protected (Nasjonalpark or Naturreservat) */
	hasStrictProtection: boolean;
};

/** Miljødirektoratet Grunnforurensning (contaminated ground sites) */
export type GrunnforurensningItem = {
	/** Site name */
	name: string;
	/** Site type (e.g. "Industri", "Deponi") */
	siteType: string | null;
	/** Responsible authority */
	authority: string | null;
	/** Process status (e.g. "Avsluttet", "Pågående") */
	processStatus: string | null;
	/** Impact grade (e.g. "Liten", "Stor") */
	impactGrade: string | null;
	/** Health-based condition class (e.g. "Klasse 1", "Klasse 2") */
	healthClass: string | null;
	/** URL to faktaark */
	faktaark: string | null;
};

export type GrunnforurensningData = {
	/** Number of contaminated sites the property falls within */
	count: number;
	/** The individual sites */
	items: GrunnforurensningItem[];
	/** True if any site has HelsebasertTilstandsklasse "Klasse 1" or "Klasse 2" */
	hasHighRisk: boolean;
};

export type RisikoData = {
	/** NGU Radon aktsomhetsnivå */
	radon: {
		level: RadonLevel;
		detail: string;
	} | null;
	/** NVE Kvikkleire skred aktsomhet */
	kvikkleire: {
		inZone: boolean;
		detail: string;
	} | null;
	/** NGU Løsmasser — loose deposits / quaternary geology */
	losmasser: LosmasseData | null;
	/** NGU Berggrunn — bedrock geology */
	berggrunn: BerggrunData | null;
	/** Riksantikvaren Kulturminner — nearby cultural heritage sites */
	kulturminner: KulturminneData | null;
	/** Støysoner — noise zones from veg/jernbane/militær sources */
	stoy: StoyData | null;
	/** Miljødirektoratet Naturvernområder — protected nature areas */
	naturvern: NaturvernData | null;
	/** Miljødirektoratet Grunnforurensning — contaminated ground sites */
	grunnforurensning: GrunnforurensningData | null;
};

/* ------------------------------------------------------------------ */
/*  Generelt tab data                                                   */
/* ------------------------------------------------------------------ */

/** DIBK Kommuneplan arealformål (municipal land use plan) */
export type KommuneplanData = {
	/** Land use category (arealformål) — the most important field */
	formaal: string | null;
	/** Utilization grade (utnyttingsgrad) */
	utnyttingsgrad: string | null;
	/** Remaining key-value details */
	details: Record<string, string>;
};

/** DiBK Planlegging igangsatt — active planning areas (initiated but not yet adopted) */
export type PlanleggingIgangsattData = {
	/** Plan name */
	plannavn: string | null;
	/** Plan type (e.g. "Reguleringsplan", "Kommuneplan") */
	plantype: string | null;
	/** Date planning was formally initiated */
	igangsettingsdato: string | null;
	/** Remaining key-value details */
	details: Record<string, string>;
};

export type GenereltData = {
	/** Matrikkel information from Kartverket */
	matrikkelInfo: string;
	/** Any additional property-level details */
	details: Record<string, string>;
	/** Set when the WMS service returned a ServiceException error */
	serviceError?: string;
	/** DIBK Kommuneplan arealformål */
	kommuneplan: KommuneplanData | null;
	/** DIBK Kommunedelplan arealformål — same structure as kommuneplan */
	kommunedelplan: KommuneplanData | null;
	/** DiBK Planlegging igangsatt — active planning area, if any */
	planleggingIgangsatt: PlanleggingIgangsattData | null;
};

/* ------------------------------------------------------------------ */
/*  Aggregated feature info per property                                */
/* ------------------------------------------------------------------ */

export type FeatureInfoData = {
	klima: KlimaData | null;
	risiko: RisikoData | null;
	generelt: GenereltData | null;
	/** Timestamp when data was fetched (ms since epoch) */
	fetchedAt: number;
};

/** Cache entry states */
export type FeatureInfoEntry =
	| { status: "loading" }
	| { status: "loaded"; data: FeatureInfoData }
	| { status: "error"; error: string };
