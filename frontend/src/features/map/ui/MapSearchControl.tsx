import { ArrowRight, Search, X } from "lucide-react";
import L, { type ControlPosition } from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import type { GeoKodingRespons, OutputAdresse, OutputAdresseList } from "../api/types";

async function searchAddresses(
	params: Record<string, string | number | boolean | undefined>,
): Promise<OutputAdresseList> {
	const url = new URL("/api/v1/addresses/search", window.location.origin);
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
	}
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error(`Address search failed (${res.status})`);
	return res.json() as Promise<OutputAdresseList>;
}

async function getGeokoding(
	params: Record<string, string | number | boolean | undefined>,
): Promise<GeoKodingRespons> {
	const url = new URL("/api/v1/properties/geokoding", window.location.origin);
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
	}
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error(`Geokoding failed (${res.status})`);
	return res.json() as Promise<GeoKodingRespons>;
}
import { parsePartialMatrikkel } from "../domain/matrikkelParser";
import type { SearchQuery } from "../domain/types";

/* Note: Search control CSS has been extracted to map.css */

/** Debounce delay for typeahead in ms */
const DEBOUNCE_MS = 300;

/** Results per page for typeahead suggestion queries */
const RESULTS_PER_PAGE = 50;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type SearchMode = "address" | "matrikkel";

type MapSearchControlProps = {
	position?: ControlPosition;
	onSearch: (query: SearchQuery) => void;
	onClear?: () => void;
	isLoading?: boolean;
	helperText?: string;
};

export function MapSearchControl({
	position = "topleft",
	onSearch,
	onClear,
	isLoading = false,
	helperText = "Du kan søke på adresse (fantoftvegen 14P) eller gbnr (33/2 Rana)",
}: MapSearchControlProps) {
	const map = useMap();
	const [mounted, setMounted] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const [mode, setMode] = useState<SearchMode>("address");
	const [addressText, setAddressText] = useState("");
	const [matrikkelText, setMatrikkelText] = useState("");

	/* ---- Typeahead state ---- */
	const [suggestions, setSuggestions] = useState<OutputAdresse[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const helpId = "map-search-help";

	const hasContent =
		mode === "address"
			? addressText.trim().length > 0
			: matrikkelText.trim().length > 0;

	/* Build and mount the L.Control container */
	const control = useMemo(() => {
		const c = new L.Control({ position });
		c.onAdd = () => {
			const div = L.DomUtil.create("div", "map-search-control");
			L.DomEvent.disableClickPropagation(div);
			L.DomEvent.disableScrollPropagation(div);
			L.DomEvent.on(div, "pointerdown", L.DomEvent.stopPropagation);
			L.DomEvent.on(div, "pointerup", L.DomEvent.stopPropagation);
			containerRef.current = div;
			return div;
		};
		return c;
	}, [position]);

	useEffect(() => {
		control.addTo(map);
		setMounted(true);
		return () => {
			control.remove();
			setMounted(false);
			containerRef.current = null;
		};
	}, [map, control]);

	/* ---- Debounced typeahead for address mode ---- */
	useEffect(() => {
		if (mode !== "address" || addressText.trim().length < 2) {
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
				setActiveIndex(-1);
			} catch {
				setSuggestions([]);
				setShowSuggestions(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [addressText, mode]);

	/* ---- Debounced typeahead for matrikkel mode ---- */
	useEffect(() => {
		if (mode !== "matrikkel" || matrikkelText.trim().length < 2) {
			if (mode === "matrikkel") {
				setSuggestions([]);
				setShowSuggestions(false);
			}
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
				setActiveIndex(-1);
			} catch {
				setSuggestions([]);
				setShowSuggestions(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [matrikkelText, mode]);

	const selectSuggestion = useCallback(
		(addr: OutputAdresse) => {
			setAddressText(addr.adressetekst);
			setSuggestions([]);
			setShowSuggestions(false);
			onSearch({ type: "address", text: addr.adressetekst });
		},
		[onSearch],
	);

	const selectMatrikkelSuggestion = useCallback(
		(addr: OutputAdresse) => {
			const text = `${addr.kommunenavn} ${addr.gardsnummer}/${addr.bruksnummer}`;
			setMatrikkelText(text);
			setSuggestions([]);
			setShowSuggestions(false);
			onSearch({ type: "matrikkel", text });
		},
		[onSearch],
	);

	const submit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			setShowSuggestions(false);
			if (mode === "address") {
				const q = addressText.trim();
				if (q) onSearch({ type: "address", text: q });
			} else {
				const q = matrikkelText.trim();
				if (q) onSearch({ type: "matrikkel", text: q });
			}
		},
		[mode, addressText, matrikkelText, onSearch],
	);

	const clear = useCallback(() => {
		setAddressText("");
		setMatrikkelText("");
		setSuggestions([]);
		setShowSuggestions(false);
		onClear?.();
	}, [onClear]);

	if (!mounted || !containerRef.current) return null;

	return createPortal(
		<>
			<form className="msc-bar" onSubmit={submit} role="search">
				{/* Left region — icon + input + clear — shows tooltip on hover */}
				<span
					className="msc-left-region"
					data-has-suggestions={showSuggestions || undefined}
				>
					{/* Search icon */}
					<span className="msc-icon" aria-hidden="true">
						{isLoading ? (
							<div
								className="sweco-spinner"
								style={{ width: 16, height: 16, backgroundSize: 16 }}
							/>
						) : (
							<Search size={15} strokeWidth={1.8} />
						)}
					</span>

					{/* Input area — always takes remaining space */}
					<span className="msc-field">
						{mode === "address" ? (
							<input
								className="msc-input"
								type="text"
								value={addressText}
								onChange={(e) => setAddressText(e.target.value)}
								placeholder="Søk etter adresse..."
								aria-label="Søk i kart"
								aria-describedby={helperText ? helpId : undefined}
								aria-autocomplete="list"
								aria-expanded={showSuggestions}
								autoComplete="off"
								onFocus={() => {
									if (suggestions.length > 0) setShowSuggestions(true);
								}}
								onBlur={() => {
									// Delay so click on suggestion registers first
									setTimeout(() => setShowSuggestions(false), 200);
								}}
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										if (showSuggestions) {
											setShowSuggestions(false);
										} else {
											clear();
											(e.target as HTMLInputElement).blur();
										}
									} else if (e.key === "ArrowDown" && showSuggestions) {
										e.preventDefault();
										setActiveIndex((i) =>
											i < suggestions.length - 1 ? i + 1 : 0,
										);
									} else if (e.key === "ArrowUp" && showSuggestions) {
										e.preventDefault();
										setActiveIndex((i) =>
											i > 0 ? i - 1 : suggestions.length - 1,
										);
									} else if (
										e.key === "Enter" &&
										showSuggestions &&
										activeIndex >= 0
									) {
										e.preventDefault();
										selectSuggestion(suggestions[activeIndex]);
									}
								}}
							/>
						) : (
							<input
								className="msc-input"
								type="text"
								value={matrikkelText}
								onChange={(e) => setMatrikkelText(e.target.value)}
								placeholder="f.eks. Bergen 33/2"
								aria-label="Søk etter eiendom med matrikkel"
								aria-autocomplete="list"
								aria-expanded={showSuggestions}
								autoComplete="off"
								onFocus={() => {
									if (suggestions.length > 0) setShowSuggestions(true);
								}}
								onBlur={() => {
									setTimeout(() => setShowSuggestions(false), 200);
								}}
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										if (showSuggestions) {
											setShowSuggestions(false);
										} else {
											clear();
											(e.target as HTMLInputElement).blur();
										}
									} else if (e.key === "ArrowDown" && showSuggestions) {
										e.preventDefault();
										setActiveIndex((i) =>
											i < suggestions.length - 1 ? i + 1 : 0,
										);
									} else if (e.key === "ArrowUp" && showSuggestions) {
										e.preventDefault();
										setActiveIndex((i) =>
											i > 0 ? i - 1 : suggestions.length - 1,
										);
									} else if (
										e.key === "Enter" &&
										showSuggestions &&
										activeIndex >= 0
									) {
										e.preventDefault();
										selectMatrikkelSuggestion(suggestions[activeIndex]);
									}
								}}
							/>
						)}
					</span>

					{/* Reserved clear-button slot — button always in DOM to prevent click-through */}
					<span className="msc-clear-slot">
						<button
							type="button"
							className="msc-clear"
							data-hidden={!hasContent}
							onClick={(e) => {
								e.stopPropagation();
								e.nativeEvent.stopImmediatePropagation();
								clear();
							}}
							onPointerDown={(e) => e.stopPropagation()}
							onPointerUp={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
							onMouseUp={(e) => e.stopPropagation()}
							aria-label="Tøm søk"
							title="Tøm"
							tabIndex={hasContent ? 0 : -1}
						>
							<X size={13} strokeWidth={2} />
						</button>
					</span>

					{/* Hover tooltip (hidden until hover with delay) */}
					{helperText && (
						<span className="msc-tooltip" role="tooltip" id={helpId}>
							{helperText}
						</span>
					)}
				</span>
				{/* end msc-left-region */}

				{/* Divider */}
				<span className="msc-divider" aria-hidden="true" />

				{/* Mode toggles (integrated in the bar) */}
				<button
					type="button"
					className="msc-toggle"
					data-active={mode === "address"}
					onClick={() => setMode("address")}
				>
					Adresse
				</button>
				<button
					type="button"
					className="msc-toggle"
					data-active={mode === "matrikkel"}
					onClick={() => setMode("matrikkel")}
				>
					Matrikkel
				</button>

				{/* Submit */}
				<button
					type="submit"
					className="msc-action"
					aria-label="Søk"
					title="Søk"
				>
					<ArrowRight size={15} strokeWidth={2} />
				</button>
			</form>

			{/* Typeahead dropdown */}
			{showSuggestions && suggestions.length > 0 && (
				<ul className="msc-suggestions" role="listbox">
					{suggestions.map((addr, i) => (
						<li
							key={
								mode === "matrikkel"
									? `${addr.kommunenummer}-${addr.gardsnummer}/${addr.bruksnummer}`
									: `${addr.adressetekst}-${addr.postnummer}`
							}
							className={`msc-suggestion ${i === activeIndex ? "msc-suggestion--active" : ""}`}
							role="option"
							aria-selected={i === activeIndex}
							onMouseDown={(e) => {
								e.preventDefault();
								if (mode === "matrikkel") {
									selectMatrikkelSuggestion(addr);
								} else {
									selectSuggestion(addr);
								}
							}}
							onMouseEnter={() => setActiveIndex(i)}
						>
							{mode === "matrikkel" ? (
								<>
									<span className="msc-suggestion__text">
										{addr.kommunenavn} {addr.gardsnummer}/{addr.bruksnummer}
									</span>
									<span className="msc-suggestion__meta">
										{addr.adressetekst}
									</span>
								</>
							) : (
								<>
									<span className="msc-suggestion__text">
										{addr.adressetekst}
									</span>
									<span className="msc-suggestion__meta">
										{addr.postnummer} {addr.poststed}
										{addr.kommunenavn ? ` — ${addr.kommunenavn}` : ""}
									</span>
								</>
							)}
						</li>
					))}
				</ul>
			)}
		</>,
		containerRef.current,
	);
}
