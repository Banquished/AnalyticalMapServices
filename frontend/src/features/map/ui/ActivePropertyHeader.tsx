import type { SelectedProperty } from "../stores/propertySelection.store";
import { PROPERTY_COLOURS } from "../stores/propertySelection.store";

/* ------------------------------------------------------------------ */
/*  ActivePropertyHeader — compact info row for analysis tabs           */
/*  Shared component reused across Generelt, Klima, and Risiko tabs.   */
/* ------------------------------------------------------------------ */

type Props = {
	item: SelectedProperty;
	index: number;
};

/**
 * Compact info row showing the active property's key fields:
 * Eiendom #, Adresse, Gnr/Bnr, Fnr.
 * Rendered at the top of each analysis tab's content area.
 */
export function ActivePropertyHeader({ item, index }: Props) {
	const colour = PROPERTY_COLOURS[item.colourIndex];
	const mid = item.property.matrikkelId;
	const addr = item.address ?? item.property.address;

	return (
		<div className="aph">
			<span
				className="aph__swatch"
				style={
					{
						"--swatch-bg": colour.fillColor,
						"--swatch-border": colour.color,
					} as React.CSSProperties
				}
			/>
			<span className="aph__label">Eiendom {index + 1}</span>
			<span className="aph__sep" aria-hidden="true">
				·
			</span>
			<span className="aph__addr">{addr?.addressText ?? "\u2014"}</span>
			<span className="aph__sep" aria-hidden="true">
				·
			</span>
			<span className="aph__gnr">
				{mid.gardsnummer}/{mid.bruksnummer}
			</span>
			{mid.festenummer != null && mid.festenummer !== 0 && (
				<>
					<span className="aph__sep" aria-hidden="true">
						·
					</span>
					<span className="aph__fnr">Fnr {mid.festenummer}</span>
				</>
			)}
		</div>
	);
}
