import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { getGeokoding, searchAddresses } from "../api/addressSearch";
import type { OutputAdresse } from "../api/types";
import { parsePartialMatrikkel } from "../domain/matrikkelParser";

const DEBOUNCE_MS = 300;
const RESULTS_PER_PAGE = 50;

type UseMatrikkelSearchResult = {
	suggestions: OutputAdresse[];
	showSuggestions: boolean;
	setShowSuggestions: Dispatch<SetStateAction<boolean>>;
};

/**
 * Debounced matrikkel typeahead. Owns its own state and debounce timer.
 * Only fetches when `active` is true and text has at least 2 characters.
 */
export function useMatrikkelSearch(
	matrikkelText: string,
	active: boolean,
): UseMatrikkelSearchResult {
	const [suggestions, setSuggestions] = useState<OutputAdresse[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!active || matrikkelText.trim().length < 2) {
			setSuggestions([]);
			setShowSuggestions(false);
			return;
		}

		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			try {
				const parsed = parsePartialMatrikkel(matrikkelText.trim());

				let unique: OutputAdresse[] = [];

				if (parsed.gnr !== undefined) {
					const res = await searchAddresses({
						treffPerSide: RESULTS_PER_PAGE,
						gardsnummer: parsed.gnr,
						bruksnummer: parsed.bnr,
						...(/^\d{4}$/.test(parsed.kommune)
							? { kommunenummer: parsed.kommune }
							: parsed.kommune
								? { kommunenavn: parsed.kommune }
								: {}),
					});

					const seen = new Set<string>();
					unique = res.adresser.filter((a) => {
						const key = `${a.kommunenummer}-${a.gardsnummer}/${a.bruksnummer}`;
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					});

					/* Kartverket fallback: property exists but has no registered address */
					if (
						unique.length === 0 &&
						parsed.bnr !== undefined &&
						parsed.kommune
					) {
						let knr: string;
						let kNavn: string;

						if (/^\d{4}$/.test(parsed.kommune)) {
							knr = parsed.kommune;
							kNavn = parsed.kommune;
						} else {
							const fallback = await searchAddresses({
								kommunenavn: parsed.kommune,
								treffPerSide: 1,
							});
							if (fallback.adresser.length > 0) {
								knr = fallback.adresser[0].kommunenummer;
								kNavn = fallback.adresser[0].kommunenavn;
							} else {
								setSuggestions([]);
								setShowSuggestions(false);
								return;
							}
						}

						const geo = await getGeokoding({
							kommunenummer: knr,
							gardsnummer: parsed.gnr,
							bruksnummer: parsed.bnr,
							utkoordsys: 4258,
						});

						if (geo.features.length > 0) {
							const f = geo.features[0];
							unique = [
								{
									adressenavn: "",
									adressetekst:
										f.properties.matrikkelnummertekst ?? "(ingen adresse)",
									adressekode: 0,
									nummer: 0,
									kommunenummer: f.properties.kommunenummer,
									kommunenavn: kNavn,
									gardsnummer: f.properties.gardsnummer,
									bruksnummer: f.properties.bruksnummer,
									objtype: "Matrikkeladresse",
									poststed: "",
									postnummer: "",
									adressetekstutenadressetilleggsnavn: "",
									stedfestingverifisert: false,
									representasjonspunkt: { epsg: "4258", lat: 0, lon: 0 },
									oppdateringsdato: f.properties.oppdateringsdato ?? "",
								} as OutputAdresse,
							];
						}
					}
				} else {
					const res = await searchAddresses({
						sok: parsed.kommune,
						fuzzy: true,
						treffPerSide: RESULTS_PER_PAGE,
					});

					const seen = new Set<string>();
					unique = res.adresser.filter((a) => {
						const key = `${a.kommunenummer}-${a.gardsnummer}/${a.bruksnummer}`;
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					});
				}

				setSuggestions(unique);
				setShowSuggestions(unique.length > 0);
			} catch {
				setSuggestions([]);
				setShowSuggestions(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [matrikkelText, active]);

	return { suggestions, showSuggestions, setShowSuggestions };
}
