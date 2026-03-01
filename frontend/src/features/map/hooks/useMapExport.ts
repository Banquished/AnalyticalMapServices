import { useCallback } from "react";
import type { Address, Property } from "../domain/types";
import type { SelectedProperty } from "../stores/propertySelection.store";
import { usePropertySelectionStore } from "../stores/propertySelection.store";

/* ------------------------------------------------------------------ */
/*  Export data shape                                                   */
/* ------------------------------------------------------------------ */

/** Serialisable snapshot of the map service's current state. */
export type MapExportData = {
	/** Properties currently selected (with address + colour info) */
	properties: Array<{
		key: string;
		property: Property;
		address?: Address;
		colourIndex: number;
	}>;
	/** Map screenshot as raw base64 PNG (no data-URI prefix), or null */
	screenshotBase64: string | null;
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Hook for consuming apps to extract the map service's data.
 *
 * Returns the currently selected properties + last screenshot,
 * plus helpers to snapshot / clear.
 *
 * Usage:
 * ```tsx
 * const { exportData, clearScreenshot } = useMapExport();
 * // pass exportData to a report builder, PDF generator, etc.
 * ```
 */
export function useMapExport() {
	const selected = usePropertySelectionStore((s) => s.selected);
	const screenshotBase64 = usePropertySelectionStore((s) => s.screenshotBase64);
	const clearScreenshot = usePropertySelectionStore((s) => s.clearScreenshot);

	/** Snapshot current state into a serialisable object */
	const getExportData = useCallback((): MapExportData => {
		return {
			properties: selected.map((s: SelectedProperty) => ({
				key: s.key,
				property: s.property,
				address: s.address,
				colourIndex: s.colourIndex,
			})),
			screenshotBase64,
		};
	}, [selected, screenshotBase64]);

	return {
		/** Reactive selected properties list */
		selected,
		/** Latest map screenshot base64, or null */
		screenshotBase64,
		/** Build a serialisable export snapshot */
		getExportData,
		/** Clear the stored screenshot */
		clearScreenshot,
	} as const;
}
