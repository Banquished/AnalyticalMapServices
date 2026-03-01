import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
    PROPERTY_COLOURS,
    type SelectedProperty,
} from "../stores/propertySelection.store";

/* Note: Property table CSS has been extracted to map.css */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type PropertyTableProps = {
	items: SelectedProperty[];
	highlightedKey?: string | null;
	activeKey?: string | null;
	onRemove: (key: string) => void;
	onMoveUp: (index: number) => void;
	onMoveDown: (index: number) => void;
	onHighlight?: (key: string | null) => void;
	onSetActive?: (key: string) => void;
};

export function PropertyTable({
	items,
	highlightedKey,
	activeKey,
	onRemove,
	onMoveUp,
	onMoveDown,
	onHighlight,
	onSetActive,
}: PropertyTableProps) {
	if (items.length === 0) {
		return (
			<p className="pt-empty">
				Klikk i kartet eller søk for å velge eiendommer.
			</p>
		);
	}

	return (
		<div>
			<table className="prop-table">
				<thead>
					<tr>
						<th>Eiendom</th>
						<th>Adresse</th>
						<th>Gnr/Bnr</th>
						<th>Fnr</th>
						<th aria-label="Handlinger" />
					</tr>
				</thead>
				<tbody>
					{items.map((item, index) => {
						const colour = PROPERTY_COLOURS[item.colourIndex];
						const mid = item.property.matrikkelId;
						const isActive = activeKey === item.key;
						const rowClasses = [
							highlightedKey === item.key ? "pt-row-highlight" : "",
							isActive ? "pt-row-active" : "",
						]
							.filter(Boolean)
							.join(" ");
						return (
							<tr key={item.key} className={rowClasses || undefined}>
								<td
									className="pt-eiendom-cell"
									onClick={() => {
										onHighlight?.(item.key);
										onSetActive?.(item.key);
									}}
									title="Klikk for å markere i kartet og velge som aktiv"
								>
									<span className="pt-chip">
										<span
											className="pt-swatch"
											style={
												{
													"--swatch-bg": colour.fillColor,
													"--swatch-border": colour.color,
												} as React.CSSProperties
											}
										/>
										Eiendom {index + 1}
									</span>
								</td>
								<td>
									{item.address?.addressText ??
										item.property.address?.addressText ??
										"\u2014"}
								</td>
								<td>
									{mid.gardsnummer}/{mid.bruksnummer}
								</td>
								<td>{mid.festenummer ?? "\u2014"}</td>
								<td>
									<span className="pt-actions">
										<button
											type="button"
											className="pt-action"
											onClick={() => onMoveUp(index)}
											disabled={index === 0}
											aria-label={`Flytt opp eiendom ${index + 1}`}
											title="Flytt opp"
										>
											<ArrowUp size={13} />
										</button>
										<button
											type="button"
											className="pt-action"
											onClick={() => onMoveDown(index)}
											disabled={index === items.length - 1}
											aria-label={`Flytt ned eiendom ${index + 1}`}
											title="Flytt ned"
										>
											<ArrowDown size={13} />
										</button>
										<button
											type="button"
											className="pt-action pt-action-delete"
											onClick={() => onRemove(item.key)}
											aria-label={`Slett eiendom ${index + 1}`}
											title="Slett"
										>
											<Trash2 size={13} />
										</button>
									</span>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
