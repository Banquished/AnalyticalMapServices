import { useToastStore } from "@/shared/ui/toast";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Property, SearchQuery } from "./domain/types";
import { useBatchFeatureInfo, useFeatureInfo } from "./hooks/useFeatureInfo";
import { useMapInteraction } from "./hooks/useMapInteraction";
import { usePropertySearch } from "./hooks/usePropertySearch";
import { usePropertySelection } from "./hooks/usePropertySelection";
import { usePropertySelectionToasts } from "./hooks/usePropertySelectionToasts";
import { useTabStatuses, type DotStatus } from "./hooks/useTabStatuses";
import "./map.css";
import { FeatureInfoTabs } from "./ui/FeatureInfoTabs";
import { computeBounds } from "./ui/mapUtils";
import type { MapClickEvent } from "./ui/MapView";
import { MapView } from "./ui/MapView";
import { PropertyPickerPopover } from "./ui/PropertyPickerPopover";
import { SidePanel, type SidePanelTab } from "./ui/SidePanel";
import { StatusDot } from "./ui/StatusDot";

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
	} = usePropertySelection();

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
	const tabStatuses = useTabStatuses(featureInfo);

	/* ---- Side-panel tab definitions ---- */
	const SIDE_PANEL_TABS: SidePanelTab[] = useMemo(
		() => [
			{ id: "eiendommer", label: "Eiendommer" },
			{
				id: "generelt",
				label: "Generelt",
				icon: <StatusDot s={(tabStatuses.generelt ?? "none") as DotStatus} />,
			},
			{
				id: "klima",
				label: "Klima",
				icon: <StatusDot s={(tabStatuses.klima ?? "none") as DotStatus} />,
			},
			{
				id: "risiko",
				label: "Risiko",
				icon: <StatusDot s={(tabStatuses.risiko ?? "none") as DotStatus} />,
			},
			{
				id: "miljo",
				label: "Miljø",
				icon: <StatusDot s={(tabStatuses.miljo ?? "none") as DotStatus} />,
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

	/* ---- Toast notifications for search outcomes ---- */
	const showNoResults =
		!!activeResult &&
		!activeLoading &&
		!activeError &&
		activeResult.properties.length === 0;
	usePropertySelectionToasts(search.error, mapClick.error, showNoResults);

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
				renderContent={(tabId) => (
					<FeatureInfoTabs
						tabId={tabId}
						activeItem={activeItem}
						featureInfo={featureInfo}
						selected={selected}
						highlightedKey={highlightedKey}
						activeKey={activeKey}
						removeByKey={removeByKey}
						moveUp={moveUp}
						moveDown={moveDown}
						onHighlight={setHighlightedKey}
						onSetActive={setActiveKey}
					/>
				)}
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
