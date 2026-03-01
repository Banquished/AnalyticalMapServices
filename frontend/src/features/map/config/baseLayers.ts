export type BaseLayerOption = {
	name: string;
	url: string;
	attribution: string;
	maxZoom?: number;
	checked?: boolean;
};

export const baseLayerOptions: BaseLayerOption[] = [
	{
		name: "OpenStreetMap",
		url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		maxZoom: 20,
		checked: true,
	},
	{
		name: "Kartverket Topo",
		url: "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png",
		attribution: '&copy; <a href="https://kartverket.no/">Kartverket</a>',
		maxZoom: 20,
	},
	{
		name: "Dark Matter",
		url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxZoom: 20,
	},
];
