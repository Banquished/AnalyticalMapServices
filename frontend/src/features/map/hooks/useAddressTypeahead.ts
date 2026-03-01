import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { searchAddresses } from "../api/addressSearch";
import type { OutputAdresse } from "../api/types";

const DEBOUNCE_MS = 300;
const RESULTS_PER_PAGE = 50;

type UseAddressTypeaheadResult = {
	suggestions: OutputAdresse[];
	showSuggestions: boolean;
	setShowSuggestions: Dispatch<SetStateAction<boolean>>;
};

/**
 * Debounced address typeahead. Owns its own state and debounce timer.
 * Only fetches when `active` is true and text has at least 2 characters.
 */
export function useAddressTypeahead(
	addressText: string,
	active: boolean,
): UseAddressTypeaheadResult {
	const [suggestions, setSuggestions] = useState<OutputAdresse[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!active || addressText.trim().length < 2) {
			setSuggestions([]);
			setShowSuggestions(false);
			return;
		}

		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			try {
				const res = await searchAddresses({
					sok: addressText.trim(),
					fuzzy: true,
					treffPerSide: RESULTS_PER_PAGE,
				});
				setSuggestions(res.adresser);
				setShowSuggestions(res.adresser.length > 0);
			} catch {
				setSuggestions([]);
				setShowSuggestions(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [addressText, active]);

	return { suggestions, showSuggestions, setShowSuggestions };
}
