import { useToastStore } from "@/shared/ui/toast";
import type { SimpleMapScreenshoter } from "leaflet-simple-map-screenshoter";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type Props = {
	/** Called with raw base64 data (no data-URI prefix) after screenshot */
	onScreenshot?: (base64: string) => void;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Adds a screenshot control (bottom-left) to the Leaflet map.
 *
 * Uses `leaflet-simple-map-screenshoter` which captures via `dom-to-image-more`.
 * The plugin's `takeScreen("image")` call returns a data-URI string.
 */
export function MapScreenshotControl({ onScreenshot }: Props) {
	const map = useMap();
	const screenshotterRef = useRef<SimpleMapScreenshoter | null>(null);
	const addToast = useToastStore((s) => s.addToast);

	// Keep callback ref fresh without re-mounting the control
	const callbackRef = useRef(onScreenshot);
	callbackRef.current = onScreenshot;

	useEffect(() => {
		let cancelled = false;

		// Dynamic import — the package doesn't ship ESM so we lazy-load it
		import("leaflet-simple-map-screenshoter").then((mod) => {
			if (cancelled || screenshotterRef.current) return;

			// The module exports the constructor — handle both default and named
			const raw = mod as Record<string, unknown>;
			const Ctor = (raw.SimpleMapScreenshoter ?? raw.default) as new (
				options?: ConstructorParameters<typeof SimpleMapScreenshoter>[0],
			) => SimpleMapScreenshoter;

			const screenshotter = new Ctor({
				position: "bottomleft",
				preventDownload: true,
				mimeType: "image/png",
				screenName: "map-screenshot",
				hideElementsWithSelectors: [
					".leaflet-control-container",
					".map-search-control",
					".property-picker",
				],
			});

			screenshotter.addTo(map);
			screenshotterRef.current = screenshotter;

			/*
			 * Listen for the plugin's click event, then call takeScreen
			 * which uses dom-to-image-more internally.
			 */
			map.on("simpleMapScreenshoter.click", async () => {
				try {
					const result = await screenshotter.takeScreen("image");
					if (result instanceof Error) {
						addToast("warning", "Kunne ikke ta skjermbilde.");
						return;
					}
					// result is a data-URI string like "data:image/png;base64,..."
					const base64 = result.includes(",")
						? result.slice(result.indexOf(",") + 1)
						: result;
					callbackRef.current?.(base64);
				} catch {
					addToast("warning", "Kunne ikke ta skjermbilde.");
				}
			});
		});

		return () => {
			cancelled = true;
			if (screenshotterRef.current) {
				screenshotterRef.current.remove();
				screenshotterRef.current = null;
			}
		};
	}, [map]);

	return null;
}
