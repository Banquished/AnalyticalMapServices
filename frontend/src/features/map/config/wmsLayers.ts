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
];
