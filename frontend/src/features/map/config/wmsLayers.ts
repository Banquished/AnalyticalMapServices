/* ------------------------------------------------------------------ */
/*  WMS overlay layer definitions                                      */
/*  Extracted from MapView.tsx — Phase 4.1.2                           */
/* ------------------------------------------------------------------ */

export type WmsLayerOption = {
	name: string;
	url: string;
	layers: string;
	format: string;
	version: string;
	transparent: boolean;
	opacity: number;
	checkedByDefault?: boolean;
};

export const wmsLayersOptions: WmsLayerOption[] = [
	{
		name: "Matrikkelkart",
		url: "https://wms.geonorge.no/skwms1/wms.matrikkelkart",
		layers: "matrikkelkart",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 1,
		checkedByDefault: true,
	},
	// ---- Generelt: DIBK plan layers ----
	{
		name: "Kommuneplan arealformål",
		url: "https://nap.ft.dibk.no/services/wms/kommuneplaner/",
		layers: "arealformal_kp",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.6,
	},
	{
		name: "Kommunedelplan arealformål",
		url: "https://nap.ft.dibk.no/services/wms/kommuneplaner/",
		layers: "arealformal_kdp",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.6,
	},
	{
		name: "Planlegging igangsatt",
		url: "https://plandata.ft.dibk.no/services/wms/planleggingigangsatt/",
		layers: "planomrade_v",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.6,
	},
	{
		name: "Radon",
		url: "https://geo.ngu.no/mapserver/RadonWMS2",
		layers: "Radon_aktsomhet",
		format: "image/png",
		version: "1.1.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Flomsone 50 års flom",
		url: "https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer",
		layers: "Flomsone_50arsflom",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Flomsone 100 års flom",
		url: "https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer",
		layers: "Flomsone_100arsflom",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Flomsone 200 års flom",
		url: "https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer",
		layers: "Flomsone_200arsflom",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Skredfaresone 100 års",
		url: "https://nve.geodataonline.no/arcgis/services/Skredfaresoner1/MapServer/WMSServer",
		layers: "Skredsoner_100",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Kvikkleire skred aktsomhet",
		url: "https://nve.geodataonline.no/arcgis/services/KvikkleireskredAktsomhet/MapServer/WMSServer",
		layers: "KvikkleireskredAktsomhet",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Løsmasser",
		url: "https://geo.ngu.no/mapserver/LosmasserWMS2",
		layers: "Losmasse_flate",
		format: "image/png",
		version: "1.1.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Berggrunn",
		url: "https://geo.ngu.no/mapserver/BerggrunnWMS3",
		layers: "Berggrunn_nasjonal_hovedbergarter",
		format: "image/png",
		version: "1.1.0",
		transparent: true,
		opacity: 0.4,
	},
	// ---- Miljø: Støysoner ----
	{
		name: "Støysone jernbane",
		url: "https://wms.geonorge.no/skwms1/wms.stoysonerjernbanenett",
		layers: "stoy",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Støysone skytebane/militær",
		url: "https://wms.geonorge.no/skwms1/wms.stoyskytebane",
		layers: "stoyskytebane",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	{
		name: "Støy strategisk veg",
		url: "https://kart.miljodirektoratet.no/arcgis/services/stoy/stoykart_strategisk_veg/MapServer/WMSServer",
		layers: "stoy_veg_dogn",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.5,
	},
	// ---- Miljø: Naturvern og forurensning ----
	{
		name: "Naturvernområder",
		url: "https://kart.miljodirektoratet.no/arcgis/services/vern/MapServer/WMSServer",
		layers: "naturvern_omrade",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.4,
	},
	{
		name: "Forurenset grunn",
		url: "https://kart.miljodirektoratet.no/arcgis/services/grunnforurensning2/MapServer/WMSServer",
		layers: "forurenset_omrade",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.6,
	},
	// ---- Miljø: Kulturminner ----
	{
		name: "Kulturminner",
		url: "https://kart.ra.no/wms/kulturminner2",
		layers: "Lokalitetsikoner",
		format: "image/png",
		version: "1.3.0",
		transparent: true,
		opacity: 0.8,
	},
];
