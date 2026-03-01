import { AlertCircle, FileText, Home, Info, Map } from "lucide-react";
import type { GenereltData } from "../domain/featureInfoTypes";

/* ------------------------------------------------------------------ */
/*  GenereltTab — general property information from Matrikkelkart       */
/* ------------------------------------------------------------------ */

type Props = {
	data: GenereltData | null;
};

export function GenereltTab({ data }: Props) {
	if (!data) {
		return (
			<div className="fi-tab">
				<div className="fi-tab__no-data">
					<Info size={14} />
					<span>Ingen eiendomsdata tilgjengelig fra Matrikkelkart.</span>
				</div>
			</div>
		);
	}

	// WMS service returned an error (e.g. ServiceExceptionReport)
	if (data.serviceError) {
		return (
			<div className="fi-tab">
				<div className="fi-error">
					<AlertCircle size={14} />
					<span>{data.serviceError}</span>
				</div>
			</div>
		);
	}

	const entries = Object.entries(data.details);

	return (
		<div className="fi-tab">
			{/* ── Eiendomsdetaljer (Matrikkelkart) ── */}
			{(entries.length > 0 || data.matrikkelInfo) && (
				<>
					<h3 className="fi-tab__section-title">
						<Home size={14} />
						<span>Eiendomsdetaljer (Matrikkelkart)</span>
					</h3>
					{entries.length > 0 ? (
						<table className="fi-tab__details-table">
							<tbody>
								{entries.map(([key, value]) => (
									<tr key={key}>
										<td className="fi-tab__detail-key">{key}</td>
										<td className="fi-tab__detail-value">{value}</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<pre className="fi-tab__raw-text">{data.matrikkelInfo}</pre>
					)}
				</>
			)}

			{/* ── Kommuneplan arealformål ── */}
			<h3 className="fi-tab__section-title">
				<Map size={14} />
				<span>Kommuneplan arealformål (DIBK)</span>
			</h3>
			{data.kommuneplan ? (
				<table className="fi-tab__details-table">
					<tbody>
						{data.kommuneplan.formaal && (
							<tr>
								<td className="fi-tab__detail-key">Arealformål</td>
								<td className="fi-tab__detail-value">{data.kommuneplan.formaal}</td>
							</tr>
						)}
						{data.kommuneplan.utnyttingsgrad && (
							<tr>
								<td className="fi-tab__detail-key">Utnyttingsgrad</td>
								<td className="fi-tab__detail-value">{data.kommuneplan.utnyttingsgrad}</td>
							</tr>
						)}
						{Object.entries(data.kommuneplan.details)
							.filter(
								([k]) =>
									k !== "Arealformål" &&
									k !== "Utnyttingsgrad",
							)
							.map(([k, v]) => (
								<tr key={k}>
									<td className="fi-tab__detail-key">{k}</td>
									<td className="fi-tab__detail-value">{v}</td>
								</tr>
							))}
					</tbody>
				</table>
			) : (
				<div className="fi-tab__no-data">
					<Info size={14} />
					<span>Ingen kommuneplaner funnet for denne eiendommen.</span>
				</div>
			)}

			{/* ── Kommunedelplan arealformål ── */}
			<h3 className="fi-tab__section-title">
				<FileText size={14} />
				<span>Kommunedelplan arealformål (DIBK)</span>
			</h3>
			{data.kommunedelplan ? (
				<table className="fi-tab__details-table">
					<tbody>
						{data.kommunedelplan.formaal && (
							<tr>
								<td className="fi-tab__detail-key">Arealformål</td>
								<td className="fi-tab__detail-value">{data.kommunedelplan.formaal}</td>
							</tr>
						)}
						{data.kommunedelplan.utnyttingsgrad && (
							<tr>
								<td className="fi-tab__detail-key">Utnyttingsgrad</td>
								<td className="fi-tab__detail-value">{data.kommunedelplan.utnyttingsgrad}</td>
							</tr>
						)}
						{Object.entries(data.kommunedelplan.details)
							.filter(
								([k]) =>
									k !== "Arealformål" &&
									k !== "Utnyttingsgrad",
							)
							.map(([k, v]) => (
								<tr key={k}>
									<td className="fi-tab__detail-key">{k}</td>
									<td className="fi-tab__detail-value">{v}</td>
								</tr>
							))}
					</tbody>
				</table>
			) : (
				<div className="fi-tab__no-data">
					<Info size={14} />
					<span>Ingen kommunedelplaner funnet for denne eiendommen.</span>
				</div>
			)}
		</div>
	);
}
