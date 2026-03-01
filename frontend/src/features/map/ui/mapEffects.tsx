import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { MapClickEvent } from "../domain/types";

/* ------------------------------------------------------------------ */
/*  Map effect sub-components (need useMap())                          */
/*  Extracted from MapView.tsx — Phase 4.1.2                           */
/* ------------------------------------------------------------------ */

/** Dispatches map click events with modifier-key info. */
export function MapClickHandler({
	onClick,
}: {
	onClick: (event: MapClickEvent) => void;
}) {
	useMapEvents({
		click(e) {
			onClick({
				point: { lat: e.latlng.lat, lng: e.latlng.lng },
				screenPoint: {
					x: e.originalEvent.clientX,
					y: e.originalEvent.clientY,
				},
				shiftKey: e.originalEvent.shiftKey,
				ctrlKey: e.originalEvent.ctrlKey || e.originalEvent.metaKey,
			});
		},
	});
	return null;
}

/** Smoothly fly to a target when it changes. */
export function FlyTo({
	center,
	zoom,
}: {
	center: [number, number];
	zoom: number;
}) {
	const map = useMap();
	useEffect(() => {
		map.flyTo(center, zoom, { duration: 1.2 });
	}, [map, center, zoom]);
	return null;
}

/** Fit the map to the given bounds with padding. */
export function FitBounds({
	bounds,
}: {
	bounds: [[number, number], [number, number]];
}) {
	const map = useMap();
	useEffect(() => {
		map.flyToBounds(bounds, {
			padding: [40, 40],
			duration: 1.2,
			maxZoom: 17,
		});
	}, [map, bounds]);
	return null;
}

/** Invalidate map size when the side-panel opens/closes. */
export function ResizeOnPanel({ open }: { open: boolean }) {
	const map = useMap();
	useEffect(() => {
		const a = requestAnimationFrame(() => map.invalidateSize());
		const b = setTimeout(() => map.invalidateSize(), 300);
		return () => {
			cancelAnimationFrame(a);
			clearTimeout(b);
		};
	}, [open, map]);
	return null;
}

/**
 * Offset the Leaflet topright control container so it sits
 * below the panel toggle button and to the left of the open panel.
 */
export function AdjustTopRightControls({
	open,
	width,
}: {
	open: boolean;
	width: number;
}) {
	const map = useMap();
	useEffect(() => {
		const container = map.getContainer();
		const topRight = container.querySelector(
			".leaflet-top.leaflet-right",
		) as HTMLElement | null;
		if (topRight) {
			topRight.style.transition = "right 0.25s ease-in-out";
			topRight.style.right = open ? `${width}px` : "0px";
			/* Clear the toggle button: top-3 (12px) + h-8 (32px) = 44px bottom edge.
			 * Leaflet adds 10px margin-top to the first control, so container_top
			 * needs to be 44 - 10 + desired_gap = 42px for a ~8px visual gap. */
			topRight.style.top = "42px";
		}
	}, [map, open, width]);
	return null;
}
