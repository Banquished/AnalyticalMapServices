import { useCallback, useState } from "react";
import { lookupByCoordinates } from "../domain/propertyLookup";
import { decideSelection } from "../domain/propertySelection";
import type { Property, PropertyLookupResult } from "../domain/types";
import type { MapClickEvent } from "../ui/MapView";

type PickerState = {
	candidates: Property[];
	/** Screen-space position for anchoring the popover */
	position: { x: number; y: number };
};

type MapInteractionState = {
	isLoading: boolean;
	error: string | null;
	/** Result used when auto-selecting the nearest property */
	autoResult: PropertyLookupResult | null;
	/** Non-null when the picker popover should be displayed */
	picker: PickerState | null;
};

/**
 * React hook for handling map click → property lookup with disambiguation.
 *
 * - 1 click = 1 property when the nearest result is close enough.
 * - Shift/Ctrl + click, or distant results, open a picker popover.
 */
export function useMapInteraction() {
	const [state, setState] = useState<MapInteractionState>({
		isLoading: false,
		error: null,
		autoResult: null,
		picker: null,
	});

	const handleMapClick = useCallback(async (event: MapClickEvent) => {
		setState({ isLoading: true, error: null, autoResult: null, picker: null });

		try {
			const result = await lookupByCoordinates(event.point);

			const decision = decideSelection(result, event.shiftKey || event.ctrlKey);

			switch (decision.kind) {
				case "empty":
					setState({
						isLoading: false,
						error: null,
						autoResult: result,
						picker: null,
					});
					return;

				case "auto":
					setState({
						isLoading: false,
						error: null,
						autoResult: {
							properties: [decision.property],
							address: result.address,
						},
						picker: null,
					});
					return;

				case "disambiguate":
					setState({
						isLoading: false,
						error: null,
						autoResult: null,
						picker: {
							candidates: decision.candidates,
							position: event.screenPoint,
						},
					});
					return;
			}
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Feil ved oppslag av eiendom";
			setState({
				isLoading: false,
				error: message,
				autoResult: null,
				picker: null,
			});
		}
	}, []);

	/** User confirmed their pick from the disambiguation popover. */
	const confirmPick = useCallback((selected: Property[]) => {
		setState({
			isLoading: false,
			error: null,
			autoResult: {
				properties: selected,
				address: undefined,
			},
			picker: null,
		});
	}, []);

	/** User cancelled the disambiguation popover. */
	const cancelPick = useCallback(() => {
		setState((prev) => ({ ...prev, picker: null }));
	}, []);

	const clear = useCallback(() => {
		setState({
			isLoading: false,
			error: null,
			autoResult: null,
			picker: null,
		});
	}, []);

	return {
		isLoading: state.isLoading,
		error: state.error,
		result: state.autoResult,
		picker: state.picker,
		handleMapClick,
		confirmPick,
		cancelPick,
		clear,
	};
}
