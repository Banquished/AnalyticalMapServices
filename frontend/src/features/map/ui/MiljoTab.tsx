import {
	ExternalLink,
	History,
	Landmark,
	Route,
	Crosshair,
	Train,
	TreePine,
	Volume2,
	FlaskConical,
} from "lucide-react";
import { useState } from "react";
import type {
    DataFreshness,
    GrunnforurensningData,
    KulturminneData,
    NaturvernData,
    StoyData,
} from "../domain/featureInfoTypes";
import { StatusRowComponent } from "./StatusRow";

/* ------------------------------------------------------------------ */
/*  MiljøTab — kulturminner, støysoner, naturvernområder                */
/* ------------------------------------------------------------------ */

type Props = {
	kulturminner: KulturminneData | null;
	stoy: StoyData | null;
	naturvern: NaturvernData | null;
	grunnforurensning: GrunnforurensningData | null;
};

/* ---- Shared status helper ---- */

function deriveCountStatus<T extends { count: number }>(
	data: T | null,
	isHighRisk: (d: T) => boolean,
): "pass" | "warn" | "fail" | "no-data" {
	if (!data) return "no-data";
	if (isHighRisk(data)) return "fail";
	if (data.count > 0) return "warn";
	return "pass";
}

/* ---- Naturvern helpers ---- */

const naturvernStatus = (data: NaturvernData | null) =>
	deriveCountStatus(data, (d) => d.hasStrictProtection);

function naturvernSummary(data: NaturvernData | null): string {
	if (!data) return "Ingen data tilgjengelig";
	if (data.count === 0) return "Eiendommen er ikke innenfor et naturvernområde";
	const strictNote = data.hasStrictProtection ? " (strengt vernet)" : "";
	return `Eiendommen er innenfor ${data.count} naturvernområde${data.count > 1 ? "r" : ""}${strictNote}`;
}

/* ---- Grunnforurensning helpers ---- */

const grunnforurensningStatus = (data: GrunnforurensningData | null) =>
	deriveCountStatus(data, (d) => d.hasHighRisk);

function grunnforurensningSlot(data: GrunnforurensningData | null): string {
	if (!data) return "Ingen data tilgjengelig";
	if (data.count === 0) return "Ingen registrerte forurensede lokaliteter";
	const riskNote = data.hasHighRisk ? " (høy helserisiko)" : "";
	return `${data.count} forurenset lokalitet${data.count > 1 ? "er" : ""} registrert${riskNote}`;
}

/* ---- Kulturminner helpers ---- */

const kulturminnerStatus = (data: KulturminneData | null) =>
	deriveCountStatus(data, (d) => d.hasProtected);

function kulturminnerSummary(data: KulturminneData | null): string {
	if (!data) return "Ingen data tilgjengelig";
	if (data.count === 0) return "Ingen kulturminner funnet i nærheten";
	const protectedNote = data.hasProtected ? " (inkl. fredede)" : "";
	return `${data.count} kulturminne${data.count > 1 ? "r" : ""} funnet innen 200 m${protectedNote}`;
}

/* ---- Støy helpers ---- */

function stoyOverallStatus(
	data: StoyData | null,
): "pass" | "warn" | "fail" | "no-data" {
	if (!data) return "no-data";
	if (data.militar?.zoneCategory?.toUpperCase() === "R") return "fail";
	if (data.veg && data.veg.length > 0) return "warn";
	if (data.jernbane?.inZone) return "warn";
	if (data.militar) return "warn";
	return "pass";
}

function stoyOverallSummary(data: StoyData | null): string {
	if (!data) return "Ingen støydata tilgjengelig";
	const parts: string[] = [];
	if (data.veg && data.veg.length > 0) {
		const highest = data.veg[data.veg.length - 1];
		parts.push(`Vegstøy ${highest.decibelRange}`);
	}
	if (data.jernbane?.inZone) parts.push("Jernbanestøy");
	if (data.militar) parts.push(data.militar.zoneCategoryLabel);
	if (parts.length === 0) return "Ingen støysoner registrert";
	return parts.join(" · ");
}

function freshnessWarning(f: DataFreshness): string {
	if (f.dataYear) {
		return `${f.sourceLabel}: data fra ${f.dataYear}`;
	}
	return `${f.sourceLabel}: ukjent dataår`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function MiljoTab({ kulturminner, stoy, naturvern, grunnforurensning }: Props) {
	const [kulturminnerExpanded, setKulturminnerExpanded] = useState(false);

	const INITIAL_SHOW = 5;
	const kulturItems = kulturminner?.items ?? [];
	const visibleItems = kulturminnerExpanded
		? kulturItems
		: kulturItems.slice(0, INITIAL_SHOW);
	const hiddenCount = kulturItems.length - INITIAL_SHOW;

	return (
		<div className="fi-tab">
			{/* ── Naturvernområder ── */}
			<h3 className="fi-tab__section-title">
				<TreePine size={14} />
				<span>Naturvernområder (Miljødirektoratet)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Naturvernområde"
					status={naturvernStatus(naturvern)}
					detail={naturvernSummary(naturvern)}
					source="Miljødirektoratet Naturbase"
				/>
			</div>
			{naturvern && naturvern.items.length > 0 && (
				<div className="km-list">
					{naturvern.items.map((item, i) => (
						<div key={i} className="km-card">
							<div className="km-card__header">
								<span className="km-card__name">{item.name}</span>
								{item.faktaark && (
									<a
										href={item.faktaark}
										target="_blank"
										rel="noopener noreferrer"
										className="km-card__link"
										title="Åpne faktaark"
									>
										<ExternalLink size={12} />
									</a>
								)}
							</div>
							<div className="km-card__meta">
								{item.verneform && (
									<span className="km-card__badge">{item.verneform}</span>
								)}
								{item.iucn && (
									<span className="km-card__tag">{item.iucn}</span>
								)}
								{item.majorEcosystemType && (
									<span className="km-card__tag">{item.majorEcosystemType}</span>
								)}
								{item.vernedato && (
									<span className="km-card__tag">Vernet {item.vernedato}</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* ── Forurenset grunn ── */}
			<h3 className="fi-tab__section-title">
				<FlaskConical size={14} />
				<span>Forurenset grunn (Miljødirektoratet)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Forurenset grunn"
					status={grunnforurensningStatus(grunnforurensning)}
					detail={grunnforurensningSlot(grunnforurensning)}
					source="Miljødirektoratet Grunnforurensning"
				/>
			</div>
			{grunnforurensning && grunnforurensning.items.length > 0 && (
				<div className="km-list">
					{grunnforurensning.items.map((item, i) => (
						<div key={i} className="km-card">
							<div className="km-card__header">
								<span className="km-card__name">{item.name}</span>
								{item.faktaark && (
									<a
										href={item.faktaark}
										target="_blank"
										rel="noopener noreferrer"
										className="km-card__link"
										title="Åpne faktaark"
									>
										<ExternalLink size={12} />
									</a>
								)}
							</div>
							<div className="km-card__meta">
								{item.siteType && (
									<span className="km-card__badge">{item.siteType}</span>
								)}
								{item.healthClass && (
									<span className="km-card__tag">{item.healthClass}</span>
								)}
								{item.processStatus && (
									<span className="km-card__tag">{item.processStatus}</span>
								)}
								{item.impactGrade && (
									<span className="km-card__tag">Påvirkning: {item.impactGrade}</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* ── Kulturminner ── */}
			<h3 className="fi-tab__section-title">
				<Landmark size={14} />
				<span>Kulturminner (Riksantikvaren)</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Kulturminner i nærheten"
					status={kulturminnerStatus(kulturminner)}
					detail={kulturminnerSummary(kulturminner)}
					source="Riksantikvaren"
				/>
			</div>

			{kulturItems.length > 0 && (
				<div className="km-list">
					{visibleItems.map((item, i) => (
						<div key={i} className="km-card">
							<div className="km-card__header">
								<span className="km-card__name">{item.name}</span>
								{item.link && (
									<a
										href={item.link}
										target="_blank"
										rel="noopener noreferrer"
										className="km-card__link"
										title="Åpne i Kulturminnesøk"
									>
										<ExternalLink size={12} />
									</a>
								)}
							</div>
							<div className="km-card__meta">
								{item.protectionType && (
									<span className="km-card__badge">{item.protectionType}</span>
								)}
								{item.siteType && (
									<span className="km-card__tag">{item.siteType}</span>
								)}
								{item.category && (
									<span className="km-card__tag">{item.category}</span>
								)}
							</div>
						</div>
					))}

					{hiddenCount > 0 && (
						<button
							type="button"
							className="km-list__toggle"
							onClick={() => setKulturminnerExpanded(!kulturminnerExpanded)}
						>
							{kulturminnerExpanded ? "Vis færre" : `Vis ${hiddenCount} til…`}
						</button>
					)}
				</div>
			)}

			{/* ── Støysoner ── */}
			<h3 className="fi-tab__section-title">
				<Volume2 size={14} />
				<span>Støysoner</span>
			</h3>
			<div className="fi-tab__rows">
				<StatusRowComponent
					label="Støy"
					status={stoyOverallStatus(stoy)}
					detail={stoyOverallSummary(stoy)}
					source="Miljødirektoratet / Bane NOR / Forsvaret"
				/>
			</div>

			{stoy && (
				<div className="stoy-details">
					{stoy.veg && stoy.veg.length > 0 && (
						<div className="stoy-details__item">
							<span className="stoy-details__icon">
								<Route size={14} />
							</span>
							<span className="stoy-details__text">
								<strong>Vegstøy:</strong>{" "}
								{stoy.veg.map((v) => v.decibelRange).join(", ")}
							</span>
						</div>
					)}

					{stoy.jernbane?.inZone && (
						<div className="stoy-details__item">
							<span className="stoy-details__icon">
								<Train size={14} />
							</span>
							<span className="stoy-details__text">
								<strong>Jernbanestøy:</strong> {stoy.jernbane.detail}
							</span>
						</div>
					)}

					{stoy.militar && (
						<div className="stoy-details__item">
							<span className="stoy-details__icon">
								<Crosshair size={14} />
							</span>
							<span className="stoy-details__text">
								<strong>{stoy.militar.zoneCategoryLabel}:</strong>{" "}
								{[stoy.militar.sourceName, stoy.militar.info]
									.filter(Boolean)
									.join(" — ") || "Militær støysone"}
							</span>
						</div>
					)}

					{stoy.freshness.some((f) => f.isStale) && (
						<div className="stoy-freshness-warning">
							<History size={14} />
							<div className="stoy-freshness-warning__content">
								<span className="stoy-freshness-warning__title">
									Utdatert data — sjekk oppdaterte kilder manuelt
								</span>
								{stoy.freshness
									.filter((f) => f.isStale)
									.map((f, i) => (
										<span key={i} className="stoy-freshness-warning__line">
											{freshnessWarning(f)}
										</span>
									))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
