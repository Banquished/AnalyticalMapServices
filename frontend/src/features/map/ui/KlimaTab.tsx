import { AlertTriangle, Droplets, Mountain } from "lucide-react";
import type { KlimaData, RisikoData } from "../domain/featureInfoTypes";
import { StatusRowComponent } from "./StatusRow";

/* ------------------------------------------------------------------ */
/*  KlimaTab — flood, landslide, and quick-clay hazards                 */
/* ------------------------------------------------------------------ */

type Props = {
	data: KlimaData;
	kvikkleire: RisikoData["kvikkleire"];
};

export function KlimaTab({ data, kvikkleire }: Props) {
	return (
		<div className="fi-tab">
			<h3 className="fi-tab__section-title">
				<Droplets size={14} />
				<span>Flomsoner (NVE)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="50-års flom"
					status={
						data.flom50 === null
							? "no-data"
							: data.flom50.inZone
								? "fail"
								: "pass"
					}
					detail={data.flom50?.detail ?? "Ingen data tilgjengelig"}
					source="NVE Flomsoner"
				/>
				<StatusRowComponent
					label="100-års flom"
					status={
						data.flom100 === null
							? "no-data"
							: data.flom100.inZone
								? "fail"
								: "pass"
					}
					detail={data.flom100?.detail ?? "Ingen data tilgjengelig"}
					source="NVE Flomsoner"
				/>
				<StatusRowComponent
					label="200-års flom"
					status={
						data.flom200 === null
							? "no-data"
							: data.flom200.inZone
								? "fail"
								: "pass"
					}
					detail={data.flom200?.detail ?? "Ingen data tilgjengelig"}
					source="NVE Flomsoner"
				/>
			</div>

			<h3 className="fi-tab__section-title">
				<Mountain size={14} />
				<span>Skredfare (NVE)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Skredfaresone 100 år"
					status={
						data.skred100 === null
							? "no-data"
							: data.skred100.inZone
								? "fail"
								: "pass"
					}
					detail={data.skred100?.detail ?? "Ingen data tilgjengelig"}
					source="NVE Skredfaresoner"
				/>
			</div>

			{/* ── Kvikkleire ── */}
			<h3 className="fi-tab__section-title">
				<AlertTriangle size={14} />
				<span>Kvikkleire (NVE)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Kvikkleire aktsomhet"
					status={
						kvikkleire === null
							? "no-data"
							: kvikkleire.inZone
								? "fail"
								: "pass"
					}
					detail={kvikkleire?.detail ?? "Ingen data tilgjengelig"}
					source="NVE Kvikkleire"
				/>
			</div>
		</div>
	);
}
