import { X } from "lucide-react";
import { useMap } from "react-leaflet";
import type { SelectedProperty } from "../stores/propertySelection.store";
import { PROPERTY_COLOURS } from "../stores/propertySelection.store";

/* ------------------------------------------------------------------ */
/*  Property popup content — rich info card inside Leaflet <Popup>     */
/*  Extracted from MapView.tsx — Phase 4.1.2                           */
/* ------------------------------------------------------------------ */

type Props = {
	item: SelectedProperty;
	index: number;
};

export function PropertyPopupContent({ item, index }: Props) {
	const map = useMap();
	const colour = PROPERTY_COLOURS[item.colourIndex];
	const mid = item.property.matrikkelId;
	const addr = item.address ?? item.property.address;
	const pos = item.property.position;

	return (
		<div className="pp-card">
			{/* Header: colour swatch + label + close */}
			<div className="pp-header">
				<span
					className="pp-swatch"
					style={
						{
							"--swatch-bg": colour.fillColor,
							"--swatch-border": colour.color,
						} as React.CSSProperties
					}
				/>
				<span className="pp-label">Eiendom {index + 1}</span>
				<button
					type="button"
					className="pp-close"
					onClick={() => map.closePopup()}
					aria-label="Lukk"
					title="Lukk"
				>
					<X size={14} strokeWidth={2} aria-hidden="true" />
				</button>
			</div>

			{/* Info rows */}
			<table className="pp-info">
				<tbody>
					{addr?.addressText && (
						<tr>
							<td className="pp-key">Adresse</td>
							<td>{addr.addressText}</td>
						</tr>
					)}
					{addr?.postalCode && (
						<tr>
							<td className="pp-key">Postnr</td>
							<td>
								{addr.postalCode} {addr.postalPlace}
							</td>
						</tr>
					)}
					{addr?.municipalityName && (
						<tr>
							<td className="pp-key">Kommune</td>
							<td>
								{addr.municipalityName} ({mid.kommunenummer})
							</td>
						</tr>
					)}
					<tr>
						<td className="pp-key">Gnr/Bnr</td>
						<td>
							{mid.gardsnummer}/{mid.bruksnummer}
						</td>
					</tr>
					{mid.festenummer != null && mid.festenummer !== 0 && (
						<tr>
							<td className="pp-key">Fnr</td>
							<td>{mid.festenummer}</td>
						</tr>
					)}
					{mid.seksjonsnummer != null && mid.seksjonsnummer !== 0 && (
						<tr>
							<td className="pp-key">Snr</td>
							<td>{mid.seksjonsnummer}</td>
						</tr>
					)}
					{pos.lat !== 0 && (
						<tr>
							<td className="pp-key">Koordinater</td>
							<td>
								{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
