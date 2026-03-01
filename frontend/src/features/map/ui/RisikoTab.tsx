import { Layers, Zap } from "lucide-react";
import type { RisikoData } from "../domain/featureInfoTypes";
import { StatusRowComponent } from "./StatusRow";

/* ------------------------------------------------------------------ */
/*  RisikoTab — radon + grunnforhold                                    */
/* ------------------------------------------------------------------ */

type Props = {
	data: RisikoData;
};

function radonStatus(
	level: RisikoData["radon"],
): "pass" | "warn" | "fail" | "no-data" {
	if (!level) return "no-data";
	switch (level.level) {
		case "lav":
			return "pass";
		case "moderat":
			return "warn";
		case "høy":
			return "fail";
		default:
			return "warn";
	}
}

function radonLabel(level: RisikoData["radon"]): string {
	if (!level) return "Ingen data tilgjengelig";
	switch (level.level) {
		case "lav":
			return level.detail || "Lav aktsomhet";
		case "moderat":
			return level.detail || "Moderat aktsomhet";
		case "høy":
			return level.detail || "Høy aktsomhet";
		case "usikker":
			return level.detail || "Usikker aktsomhet";
		default:
			return level.detail || "Ukjent";
	}
}

export function RisikoTab({ data }: Props) {
	return (
		<div className="fi-tab">
			{/* ── Radon ── */}
			<h3 className="fi-tab__section-title">
				<Zap size={14} />
				<span>Radon (NGU)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Radon aktsomhet"
					status={radonStatus(data.radon)}
					detail={radonLabel(data.radon)}
					source="NGU RadonWMS"
				/>
			</div>

			{/* ── Grunnforhold (grouped) ── */}
			<h3 className="fi-tab__section-title">
				<Layers size={14} />
				<span>Grunnforhold (NGU)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Løsmasser"
					status={data.losmasser ? "pass" : "no-data"}
					detail={
						data.losmasser
							? [
									data.losmasser.type,
									data.losmasser.definition,
									data.losmasser.scale
										? `Målestokk: ${data.losmasser.scale}`
										: null,
								]
									.filter(Boolean)
									.join(" — ")
							: "Ingen data tilgjengelig"
					}
					source="NGU LosmasserWMS"
				/>
				<StatusRowComponent
					label="Berggrunn"
					status={data.berggrunn ? "pass" : "no-data"}
					detail={
						data.berggrunn
							? [
									data.berggrunn.rockType,
									data.berggrunn.unit,
									data.berggrunn.tectonicClassification,
									data.berggrunn.metamorphicFacies,
									data.berggrunn.formationAge,
								]
									.filter(Boolean)
									.join(" — ")
							: "Ingen data tilgjengelig"
					}
					source="NGU BerggrunnWMS"
				/>
			</div>
		</div>
	);
}
