import { useState } from "react";
import type { Property } from "../domain/types";
import { PROPERTY_COLOURS } from "../stores/propertySelection.store";

/* ------------------------------------------------------------------ */
/*  PropertyPickerPopover                                              */
/*  Shown when a map click is ambiguous (distance > threshold or       */
/*  modifier key held). Lists candidate properties so the user can     */
/*  select exactly which ones to add.                                  */
/* ------------------------------------------------------------------ */

type PropertyPickerProps = {
	/** Candidate properties from the API, sorted by distance */
	candidates: Property[];
	/** Screen position for the popover anchor (from Leaflet click) */
	position: { x: number; y: number };
	/** Called when user confirms their selection */
	onConfirm: (selected: Property[]) => void;
	/** Called when user cancels / dismisses the picker */
	onCancel: () => void;
	/** Called when user hovers a candidate (highlight polygon) */
	onHover?: (property: Property | null) => void;
};

export function PropertyPickerPopover({
	candidates,
	position,
	onConfirm,
	onCancel,
	onHover,
}: PropertyPickerProps) {
	const [selected, setSelected] = useState<Set<number>>(new Set());

	const toggle = (index: number) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(index)) next.delete(index);
			else next.add(index);
			return next;
		});
	};

	const handleConfirm = () => {
		const picked = candidates.filter((_, i) => selected.has(i));
		if (picked.length > 0) onConfirm(picked);
	};

	const handleSelectAll = () => {
		setSelected(new Set(candidates.map((_, i) => i)));
	};

	// Position the popover near the click, clamped to viewport
	const style = {
		position: "fixed" as const,
		left: Math.min(position.x, window.innerWidth - 360),
		top: Math.min(position.y, window.innerHeight - 400),
		zIndex: 1100,
	};

	return (
		<>
			{/* Backdrop to capture clicks outside */}
			<div
				className="property-picker-backdrop"
				onClick={onCancel}
				onKeyDown={(e) => e.key === "Escape" && onCancel()}
				role="presentation"
			/>
			<div
				className="property-picker"
				style={style}
				role="dialog"
				aria-label="Velg eiendom"
			>
				<div className="property-picker__header">
					<span className="property-picker__title">Velg eiendom</span>
					<span className="property-picker__subtitle">
						{candidates.length} eiendommer funnet nær klikkpunkt
					</span>
				</div>

				<div className="property-picker__list">
					{candidates.map((prop, i) => {
						const colour = PROPERTY_COLOURS[i % PROPERTY_COLOURS.length];
						const mid = prop.matrikkelId;
						const isSelected = selected.has(i);
						return (
							<label
								key={`${mid.kommunenummer}-${mid.gardsnummer}/${mid.bruksnummer}`}
								className={`property-picker__item ${isSelected ? "property-picker__item--selected" : ""}`}
								onMouseEnter={() => onHover?.(prop)}
								onMouseLeave={() => onHover?.(null)}
							>
								<input
									type="checkbox"
									checked={isSelected}
									onChange={() => toggle(i)}
									className="property-picker__checkbox"
								/>
								<span
									className="property-picker__swatch"
									style={
										{
											"--swatch-bg": colour.fillColor,
											"--swatch-border": colour.color,
										} as React.CSSProperties
									}
								/>
								<span className="property-picker__info">
									<span className="property-picker__matrikkel">
										{prop.matrikkelText}
									</span>
									{prop.address?.addressText && (
										<span className="property-picker__address">
											{prop.address.addressText}
										</span>
									)}
								</span>
								{prop.distanceMetres != null && (
									<span className="property-picker__distance">
										{Math.round(prop.distanceMetres)} m
									</span>
								)}
							</label>
						);
					})}
				</div>

				<div className="property-picker__footer">
					<button
						type="button"
						className="property-picker__btn property-picker__btn--secondary"
						onClick={handleSelectAll}
					>
						Velg alle
					</button>
					<span className="property-picker__spacer" />
					<button
						type="button"
						className="property-picker__btn property-picker__btn--secondary"
						onClick={onCancel}
					>
						Avbryt
					</button>
					<button
						type="button"
						className="property-picker__btn property-picker__btn--primary"
						onClick={handleConfirm}
						disabled={selected.size === 0}
					>
						Legg til ({selected.size})
					</button>
				</div>
			</div>
		</>
	);
}
