import {
	AlertCircle,
	AlertTriangle,
	CheckCircle,
	MinusCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import type { RiskStatus } from "../domain/featureInfoTypes";

/* ------------------------------------------------------------------ */
/*  StatusRow — pass/warn/fail/no-data indicator row                    */
/* ------------------------------------------------------------------ */

type Props = {
	label: string;
	status: RiskStatus;
	detail: string;
	source?: string;
};

const STATUS_CONFIG: Record<
	RiskStatus,
	{ icon: ReactNode; className: string; ariaLabel: string }
> = {
	pass: {
		icon: <CheckCircle size={16} />,
		className: "sr-status--pass",
		ariaLabel: "OK",
	},
	warn: {
		icon: <AlertTriangle size={16} />,
		className: "sr-status--warn",
		ariaLabel: "Advarsel",
	},
	fail: {
		icon: <AlertTriangle size={16} />,
		className: "sr-status--fail",
		ariaLabel: "Fare",
	},
	"no-data": {
		icon: <MinusCircle size={16} />,
		className: "sr-status--no-data",
		ariaLabel: "Ingen data",
	},
	loading: {
		icon: <i className="sweco-spinner" aria-hidden="true" />,
		className: "sr-status--loading",
		ariaLabel: "Laster",
	},
	error: {
		icon: <AlertCircle size={16} />,
		className: "sr-status--error",
		ariaLabel: "Feil",
	},
};

export function StatusRowComponent({ label, status, detail, source }: Props) {
	const config = STATUS_CONFIG[status];

	return (
		<div className={`sr-row ${config.className}`}>
			<span
				className="sr-row__icon"
				aria-label={config.ariaLabel}
				title={config.ariaLabel}
			>
				{config.icon}
			</span>
			<div className="sr-row__content">
				<span className="sr-row__label">{label}</span>
				<span className="sr-row__detail">{detail}</span>
			</div>
			{source && <span className="sr-row__source">{source}</span>}
		</div>
	);
}
