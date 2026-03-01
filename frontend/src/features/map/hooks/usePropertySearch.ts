import { useCallback, useState } from "react";
import { lookupProperty } from "../domain/propertyLookup";
import type { PropertyLookupResult, SearchQuery } from "../domain/types";

type PropertySearchState = {
	result: PropertyLookupResult | null;
	isLoading: boolean;
	error: string | null;
};

/**
 * React hook for performing property searches.
 * Thin wrapper over the framework-agnostic domain layer.
 */
export function usePropertySearch() {
	const [state, setState] = useState<PropertySearchState>({
		result: null,
		isLoading: false,
		error: null,
	});

	const search = useCallback(async (query: SearchQuery) => {
		setState({ result: null, isLoading: true, error: null });
		try {
			const result = await lookupProperty(query);
			setState({ result, isLoading: false, error: null });
			return result;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Search failed";
			setState({ result: null, isLoading: false, error: message });
			return null;
		}
	}, []);

	const clear = useCallback(() => {
		setState({ result: null, isLoading: false, error: null });
	}, []);

	return {
		...state,
		search,
		clear,
	};
}
