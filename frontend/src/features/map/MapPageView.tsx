import { useToastStore } from "@/shared/ui/toast";
import {
	AlertCircle,
	ChevronLeft,
	ChevronRight,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Property, SearchQuery } from "./domain/types";
import { useBatchFeatureInfo, useFeatureInfo } from "./hooks/useFeatureInfo";
import { useMapInteraction } from "./hooks/useMapInteraction";
import { usePropertySearch } from "./hooks/usePropertySearch";
import "./map.css";
import { usePropertySelectionStore } from "./stores/propertySelection.store";
import { ActivePropertyHeader } from "./ui/ActivePropertyHeader";
import { GenereltTab } from "./ui/GenereltTab";
import { KlimaTab } from "./ui/KlimaTab";
import { computeBounds } from "./ui/mapUtils";
import type { MapClickEvent } from "./ui/MapView";
import { MapView } from "./ui/MapView";
import { MiljoTab } from "./ui/MiljoTab";
import { PropertyPickerPopover } from "./ui/PropertyPickerPopover";
import { PropertyTable } from "./ui/PropertyTable";
import { RisikoTab } from "./ui/RisikoTab";
import { SidePanel, type SidePanelTab } from "./ui/SidePanel";
import { TabEmptyState } from "./ui/TabEmptyState";

type DotStatus = "pass" | "warn" | "fail" | "loading" | "none";
function StatusDot({ s }: { s: DotStatus }) {
	if (s === "none") return null;
	const cls = {
		pass: "bg-success",
		warn: "bg-warning",
		fail: "bg-danger",
		loading: "bg-text-muted animate-pulse",
	}[s];
	return (
		<span className={`inline-block h-1.5 w-1.5 rounded-full ${cls} shrink-0`} />
	);
}

export const MapPageView = () => {
	const search = usePropertySearch();
	const mapClick = useMapInteraction();
	const addToast = useToastStore((s) => s.addToast);

	/* ---- Selection store (batched via useShallow) ---- */
	const {
		selected,
		addResult,
		removeByKey,
		moveUp,
		moveDown,
		clearAll,
		activeKey,
		setActiveKey,
		panelOpen,
		togglePanel,
		panelWidth,
		setPanelWidth,
		setPanelResizing,
		setScreenshot,
		screenshotBase64,
		clearScreenshot,
	} = usePropertySelectionStore(
		useShallow((s) => ({
			selected: s.selected,
			addResult: s.addResult,
			removeByKey: s.removeByKey,
			moveUp: s.moveUp,
			moveDown: s.moveDown,
			clearAll: s.clearAll,
			activeKey: s.activeKey,
			setActiveKey: s.setActiveKey,
			panelOpen: s.panelOpen,
			togglePanel: s.togglePanel,
			panelWidth: s.panelWidth,
			setPanelWidth: s.setPanelWidth,
			setPanelResizing: s.setPanelResizing,
			setScreenshot: s.setScreenshot,
			screenshotBase64: s.screenshotBase64,
			clearScreenshot: s.clearScreenshot,
		})),
	);

	const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

	/* ---- Derive active property for analysis tabs ---- */
	const activeItem = useMemo(() => {
		if (!activeKey) return null;
		const index = selected.findIndex((s) => s.key === activeKey);
		if (index === -1) return null;
		return { item: selected[index], index };
	}, [activeKey, selected]);

	/* ---- Fetch GetFeatureInfo data for the active property ---- */
	const featureInfo = useFeatureInfo(activeItem);

	/* ---- Pre-fetch GetFeatureInfo for all selected properties ---- */
	useBatchFeatureInfo(selected);

	/* ---- Traffic-light status per tab ---- */
	const tabStatuses = useMemo((): Record<string, DotStatus> => {
		if (!featureInfo || featureInfo.status === "loading")
			return { klima: "loading", risiko: "loading", miljo: "loading" };
		if (featureInfo.status === "error" || featureInfo.status !== "loaded")
			return {};
		const d = featureInfo.data;
		const klimaFail =
			d.klima &&
			(d.klima.flom50?.inZone ||
				d.klima.flom100?.inZone ||
				d.klima.flom200?.inZone ||
				d.klima.skred100?.inZone ||
				d.risiko?.kvikkleire?.inZone);
		const risikoFail = d.risiko?.radon?.level === "høy";
		const risikoWarn =
			d.risiko?.radon?.level === "moderat" ||
			(d.risiko?.stoy?.veg?.length ?? 0) > 0 ||
			d.risiko?.stoy?.jernbane?.inZone ||
			d.risiko?.stoy?.militar !== null;
		const miljoFail =
			d.risiko?.naturvern?.hasStrictProtection ||
			d.risiko?.grunnforurensning?.hasHighRisk;
		const miljoWarn =
			!miljoFail &&
			((d.risiko?.kulturminner?.count ?? 0) > 0 ||
				(d.risiko?.naturvern?.count ?? 0) > 0 ||
				(d.risiko?.grunnforurensning?.count ?? 0) > 0);
		return {
			klima: klimaFail ? "fail" : d.klima ? "pass" : "none",
			risiko: risikoFail
				? "fail"
				: risikoWarn
					? "warn"
					: d.risiko
						? "pass"
						: "none",
			miljo: miljoFail ? "fail" : miljoWarn ? "warn" : "pass",
		};
	}, [featureInfo]);

	/* ---- Side-panel tab definitions ---- */
	const SIDE_PANEL_TABS: SidePanelTab[] = useMemo(
		() => [
			{ id: "eiendommer", label: "Eiendommer" },
			{ id: "generelt", label: "Generelt" },
			{
				id: "klima",
				label: "Klima",
				icon: <StatusDot s={tabStatuses.klima ?? "none"} />,
			},
			{
				id: "risiko",
				label: "Risiko",
				icon: <StatusDot s={tabStatuses.risiko ?? "none"} />,
			},
			{
				id: "miljo",
				label: "Miljø",
				icon: <StatusDot s={tabStatuses.miljo ?? "none"} />,
			},
		],
		[tabStatuses],
	);

	/* Use whichever result set was most recently populated */
	const activeResult = search.result ?? mapClick.result;
	const activeLoading = search.isLoading || mapClick.isLoading;
	const activeError = search.error ?? mapClick.error;

	/* ---- Add new results to the accumulating selection ---- */
	useEffect(() => {
		if (activeResult && !activeLoading && !activeError) {
			if (activeResult.properties.length > 0) {
				addResult(activeResult);
			}
		}
	}, [activeResult, activeLoading, activeError, addResult]);

	/* ---- Toast on error ---- */
	useEffect(() => {
		if (search.error) addToast("warning", search.error);
	}, [search.error, addToast]);

	useEffect(() => {
		if (mapClick.error) addToast("warning", mapClick.error);
	}, [mapClick.error, addToast]);

	/* ---- Toast when no results ---- */
	useEffect(() => {
		if (
			activeResult &&
			!activeLoading &&
			!activeError &&
			activeResult.properties.length === 0
		) {
			addToast("attention", "Fant ingen eiendommer for dette søket.");
		}
	}, [activeResult, activeLoading, activeError, addToast]);

	/* ---- Search handler ---- */
	const handleSearch = useCallback(
		(query: SearchQuery) => {
			mapClick.clear();
			search.search(query);
		},
		[search, mapClick],
	);

	const handleClearSearch = useCallback(() => {
		search.clear();
	}, [search]);

	/* ---- Map click handler ---- */
	const handleMapClick = useCallback(
		(event: MapClickEvent) => {
			search.clear();
			mapClick.handleMapClick(event);
		},
		[search, mapClick],
	);

	/* ---- Picker handlers ---- */
	const handlePickerConfirm = useCallback(
		(selected: Property[]) => {
			mapClick.confirmPick(selected);
		},
		[mapClick],
	);

	const handlePickerCancel = useCallback(() => {
		mapClick.cancelPick();
	}, [mapClick]);

	/* ---- Screenshot handler ---- */
	const handleScreenshot = useCallback(
		(base64: string) => {
			setScreenshot(base64);
			addToast("success", "Kartutsnitt lagret.");
		},
		[setScreenshot, addToast],
	);

	/* ---- Single address marker (hidden once multiple properties accumulate) ---- */
	const addressMarker = useMemo(() => {
		if (selected.length > 1) return undefined;
		const addr = activeResult?.address;
		if (!addr) return undefined;
		return {
			position: [addr.position.lat, addr.position.lng] as [number, number],
			label: addr.addressText,
		};
	}, [activeResult, selected.length]);

	/* ---- Fly-to target — only on initial page load with stored properties ---- */
	const hasFiredInitialFly = useRef(false);

	const flyTo = useMemo(() => {
		if (hasFiredInitialFly.current) return undefined;
		if (selected.length !== 1) return undefined;
		const first = selected[0].property;
		if (first.position.lat === 0 && first.position.lng === 0) return undefined;
		return {
			center: [first.position.lat, first.position.lng] as [number, number],
			zoom: 16,
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/* ---- Fit bounds — only on initial page load with stored properties ---- */
	const fitBounds = useMemo(():
		| [[number, number], [number, number]]
		| undefined => {
		if (hasFiredInitialFly.current) return undefined;
		if (selected.length < 2) return undefined;
		return computeBounds(selected);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/* Mark initial fly as done after first render */
	useEffect(() => {
		hasFiredInitialFly.current = true;
	}, []);

	return (
		<div className="relative h-full w-full overflow-hidden">
			{/* Map fills entire container */}
			<MapView
				selectedProperties={selected}
				highlightedKey={highlightedKey}
				activeKey={activeKey}
				onPolygonClick={(key) => {
					setActiveKey(key);
					setHighlightedKey(key);
				}}
				addressMarker={addressMarker}
				flyTo={flyTo}
				fitBounds={fitBounds}
				onMapClick={handleMapClick}
				onSearch={handleSearch}
				onClearSearch={handleClearSearch}
				isSearchLoading={activeLoading}
				panelOpen={panelOpen}
				panelWidth={panelWidth}
				onScreenshot={handleScreenshot}
			/>

			{/* Inset shadow overlay per Sweco design guide (maps & interactive) */}
			<div
				className="pointer-events-none absolute inset-0 inset-shadow"
				style={{ zIndex: 999 }}
			/>

			{/* Panel toggle — always visible, attached to panel edge */}
			<button
				type="button"
				className="absolute top-3 flex h-8 w-8 items-center justify-center rounded bg-white text-gray-700 shadow-md border-2 border-black/20 hover:bg-gray-100 dark:bg-[#1e1e1e] dark:text-gray-300 dark:border-white/20 dark:hover:bg-[#2a2a2a] transition-[right] duration-250 ease-in-out cursor-pointer"
				style={{
					zIndex: 1001,
					right: panelOpen ? panelWidth + 10 : 10,
				}}
				onClick={togglePanel}
				aria-label={panelOpen ? "Skjul panel" : "Vis panel"}
				title="Eiendomspanel"
			>
				{panelOpen ? (
					<ChevronRight size={16} />
				) : (
					<ChevronLeft size={16} />
				)}
			</button>

			{/* Resizable side-panel overlays from the right */}
			<SidePanel
				open={panelOpen}
				width={panelWidth}
				onResize={setPanelWidth}
				onResizingChange={setPanelResizing}
				onClose={togglePanel}
				tabs={SIDE_PANEL_TABS}
				renderContent={(tabId) => {
					switch (tabId) {
						case "eiendommer":
							return (
								<PropertyTable
									items={selected}
									highlightedKey={highlightedKey}
									activeKey={activeKey}
									onRemove={removeByKey}
									onMoveUp={moveUp}
									onMoveDown={moveDown}
									onHighlight={setHighlightedKey}
									onSetActive={setActiveKey}
								/>
							);
						case "generelt":
							if (!activeItem) return <TabEmptyState />;
							return (
								<div>
									<ActivePropertyHeader
										item={activeItem.item}
										index={activeItem.index}
									/>
									{featureInfo?.status === "loading" && (
										<div className="fi-loading">
											<i className="sweco-spinner" aria-hidden="true" />
											<span>Henter eiendomsdata…</span>
										</div>
									)}
									{featureInfo?.status === "error" && (
										<div className="fi-error">
											<AlertCircle size={14} />
											<span>{featureInfo.error}</span>
										</div>
									)}
									{featureInfo?.status === "loaded" && (
										<GenereltTab data={featureInfo.data.generelt} />
									)}
								</div>
							);
						case "klima":
							if (!activeItem) return <TabEmptyState />;
							return (
								<div>
									<ActivePropertyHeader
										item={activeItem.item}
										index={activeItem.index}
									/>
									{featureInfo?.status === "loading" && (
										<div className="fi-loading">
											<i className="sweco-spinner" aria-hidden="true" />
											<span>Henter klimadata…</span>
										</div>
									)}
									{featureInfo?.status === "error" && (
										<div className="fi-error">
											<AlertCircle size={14} />
											<span>{featureInfo.error}</span>
										</div>
									)}
									{featureInfo?.status === "loaded" &&
										featureInfo.data.klima && (
											<KlimaTab
												data={featureInfo.data.klima}
												kvikkleire={featureInfo.data.risiko?.kvikkleire ?? null}
											/>
										)}
								</div>
							);
						case "risiko":
							if (!activeItem) return <TabEmptyState />;
							return (
								<div>
									<ActivePropertyHeader
										item={activeItem.item}
										index={activeItem.index}
									/>
									{featureInfo?.status === "loading" && (
										<div className="fi-loading">
											<i className="sweco-spinner" aria-hidden="true" />
											<span>Henter risikodata…</span>
										</div>
									)}
									{featureInfo?.status === "error" && (
										<div className="fi-error">
											<AlertCircle size={14} />
											<span>{featureInfo.error}</span>
										</div>
									)}
									{featureInfo?.status === "loaded" &&
										featureInfo.data.risiko && (
											<RisikoTab data={featureInfo.data.risiko} />
										)}
								</div>
							);
						case "miljo":
							if (!activeItem) return <TabEmptyState />;
							return (
								<div>
									<ActivePropertyHeader
										item={activeItem.item}
										index={activeItem.index}
									/>
									{featureInfo?.status === "loading" && (
										<div className="fi-loading">
											<i className="sweco-spinner" aria-hidden="true" />
											<span>Henter miljødata…</span>
										</div>
									)}
									{featureInfo?.status === "error" && (
										<div className="fi-error">
											<AlertCircle size={14} />
											<span>{featureInfo.error}</span>
										</div>
									)}
									{featureInfo?.status === "loaded" && (
										<MiljoTab
											kulturminner={
												featureInfo.data.risiko?.kulturminner ?? null
											}
											stoy={featureInfo.data.risiko?.stoy ?? null}
											naturvern={
												featureInfo.data.risiko?.naturvern ?? null
											}
											grunnforurensning={
												featureInfo.data.risiko?.grunnforurensning ?? null
											}
										/>
									)}
								</div>
							);
						default:
							return null;
					}
				}}
				preFooter={
					screenshotBase64 ? (
						<div className="map-side-panel__screenshot-preview">
							<img
								src={`data:image/png;base64,${screenshotBase64}`}
								alt="Kartutsnitt"
							/>
						</div>
					) : undefined
				}
				footer={
					<div className="map-side-panel__footer-actions">
						{screenshotBase64 && (
							<button
								type="button"
								className="btn btn-sm btn-tertiary"
								onClick={clearScreenshot}
								title="Fjern kartutsnitt"
							>
								<X size={13} />
								<span>Fjern kartutsnitt</span>
							</button>
						)}
						<button
							type="button"
							className="btn btn-sm btn-danger"
							onClick={clearAll}
							title="Fjern alle eiendommer"
							aria-label="Fjern alle eiendommer"
						>
							<Trash2 size={13} />
							<span>Fjern alle</span>
						</button>
					</div>
				}
			/>

			{/* Loading indicator overlay */}
			{activeLoading && (
				<div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
					<div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm shadow-lg dark:bg-gray-900/90 dark:text-white">
						<i className="sweco-spinner" aria-hidden="true" />
						<span>Søker...</span>
					</div>
				</div>
			)}

			{/* Property picker popover for disambiguation */}
			{mapClick.picker && (
				<PropertyPickerPopover
					candidates={mapClick.picker.candidates}
					position={mapClick.picker.position}
					onConfirm={handlePickerConfirm}
					onCancel={handlePickerCancel}
					onHover={(prop) =>
						setHighlightedKey(
							prop
								? `${prop.matrikkelId.kommunenummer}-${prop.matrikkelId.gardsnummer}/${prop.matrikkelId.bruksnummer}`
								: null,
						)
					}
				/>
			)}
		</div>
	);
};
