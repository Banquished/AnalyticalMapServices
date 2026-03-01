declare module "leaflet-simple-map-screenshoter" {
	import type L from "leaflet";

	interface ScreenshoterOptions {
		position?: L.ControlPosition;
		preventDownload?: boolean;
		mimeType?: string;
		screenName?: string;
		hideElementsWithSelectors?: string[];
		/** Options forwarded to dom-to-image-more */
		domtoimageOptions?: Record<string, unknown>;
	}

	export class SimpleMapScreenshoter extends L.Control {
		constructor(options?: ScreenshoterOptions);
		takeScreen(format: "image"): Promise<string | Error>;
		takeScreen(format: "blob"): Promise<Blob | Error>;
	}

	export default SimpleMapScreenshoter;
}
