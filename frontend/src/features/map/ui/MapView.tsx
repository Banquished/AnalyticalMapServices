import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    LayerGroup,
    LayersControl,
    MapContainer,
    Marker,
    Polygon,
    Popup,
    TileLayer,
    Tooltip,
    WMSTileLayer,
    ZoomControl,
} from "react-leaflet";
import { baseLayerOptions } from "../config/baseLayers";
import { wmsLayersOptions } from "../config/wmsLayers";
import type { MapClickEvent, SearchQuery } from "../domain/types";
import type { SelectedProperty } from "../stores/propertySelection.store";
import { PROPERTY_COLOURS } from "../stores/propertySelection.store";
import { MapScreenshotControl } from "./MapScreenshotControl";
import { MapSearchControl } from "./MapSearchControl";
import { PropertyPopupContent } from "./PropertyPopupContent";
import {
    AdjustTopRightControls,
    FitBounds,
    FlyTo,
    MapClickHandler,
    ResizeOnPanel,
} from "./mapEffects";
import { faLocationIcon, geoJsonToLeafletPositions } from "./mapUtils";

/* Note: All Leaflet popup/tooltip/zoom/card CSS has been extracted to map.css */

/** Default centre: roughly central Norway */
const DEFAULT_CENTER: [number, number] = [63.43, 10.39];
const DEFAULT_ZOOM = 5;

/* ------------------------------------------------------------------ */
/*  Re-export MapClickEvent for consumers that imported from MapView   */
/* ------------------------------------------------------------------ */

export type { MapClickEvent } from "../domain/types";

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

type MapViewProps = {
	/** Selected properties with colour info */
	selectedProperties?: SelectedProperty[];
	/** Key of the property to highlight (pulsing border) */
	highlightedKey?: string | null;
	/** Key of the currently-active property for analysis tabs */
	activeKey?: string | null;
	/** Callback when a polygon is clicked — sets the property as active */
	onPolygonClick?: (key: string) => void;
	/** Single address / click-point marker */
	addressMarker?: { position: [number, number]; label?: string };
	/** When set, the map will fly to this centre (single-property result) */
	flyTo?: { center: [number, number]; zoom: number };
	/** When set, the map will fit to these bounds (multi-property result) */
	fitBounds?: [[number, number], [number, number]];
	onMapClick?: (event: MapClickEvent) => void;
	/** Floating search */
	onSearch: (query: SearchQuery) => void;
	onClearSearch?: () => void;
	isSearchLoading?: boolean;
	/** Panel open state for resize invalidation */
	panelOpen: boolean;
	/** Panel width in pixels (for control offset) */
	panelWidth: number;
	/** Callback to receive screenshot base64 data */
	onScreenshot?: (base64: string) => void;
};

/* ------------------------------------------------------------------ */
/*  MapView                                                            */
/* ------------------------------------------------------------------ */

/**
 * Full-viewport Leaflet map with:
 * - Per-property coloured polygons
 * - Floating search control (topleft)
 * - Panel toggle control (topright)
 * - FA address marker
 * - Click handler & fly-to animation
 */
export function MapView({
	selectedProperties = [],
	highlightedKey,
	activeKey,
	onPolygonClick,
	addressMarker,
	flyTo: flyToTarget,
	fitBounds: fitBoundsTarget,
	onMapClick,
	onSearch,
	onClearSearch,
	isSearchLoading,
	panelOpen,
	panelWidth,
	onScreenshot,
}: MapViewProps) {
	return (
		<MapContainer
			center={DEFAULT_CENTER}
			zoom={DEFAULT_ZOOM}
			className="h-full w-full"
			scrollWheelZoom={true}
			zoomControl={false}
		>
			{/* Zoom control in bottom-left so search bar sits above */}
			<ZoomControl position="bottomleft" />
			{/* WMS overlays + base layer control */}
			<LayersControl position="topright">
				{/* Base layers — radio switcher */}
				{baseLayerOptions.map((layer) => (
					<LayersControl.BaseLayer
						key={layer.name}
						name={layer.name}
						checked={layer.checked ?? false}
					>
						<TileLayer
							url={layer.url}
							attribution={layer.attribution}
							maxZoom={layer.maxZoom ?? 20}
						/>
					</LayersControl.BaseLayer>
				))}

				{/* "Farget eiendom" at top of the list (most important, always on) */}
				<LayersControl.Overlay key="fargekart" name="Farget eiendom" checked>
					<LayerGroup>
						{selectedProperties.map((item) => {
							const geom = item.property.areaGeometry;
							if (!geom || geom.length === 0) return null;
							const colour = PROPERTY_COLOURS[item.colourIndex];
							const multiPositions = geoJsonToLeafletPositions(geom);
							const isHighlighted = highlightedKey === item.key;
							const isActive = activeKey === item.key;
							const isSelected = isHighlighted || isActive;
							return (
								<Polygon
									key={item.key}
									positions={multiPositions}
									pathOptions={{
										fillColor: colour.fillColor,
										color: isSelected ? "#538840" : colour.color,
										fillOpacity: isSelected ? 0.55 : 0.3,
										weight: isSelected ? 4 : 2,
										dashArray: isSelected ? "6 4" : undefined,
									}}
									eventHandlers={{
										click: (e) => {
											L.DomEvent.stopPropagation(e);
											onPolygonClick?.(item.key);
										},
									}}
								>
									<Tooltip sticky offset={[14, -6]}>
										<strong>Eiendom: {item.property.matrikkelText}</strong>
										{item.address?.addressText && (
											<>
												<br />
												{item.address.addressText}
											</>
										)}
									</Tooltip>
									<Popup closeButton={false}>
										<PropertyPopupContent
											item={item}
											index={selectedProperties.indexOf(item)}
										/>
									</Popup>
								</Polygon>
							);
						})}
					</LayerGroup>
				</LayersControl.Overlay>

				{/* WMS overlay layers */}
				{wmsLayersOptions.map((layer) => (
					<LayersControl.Overlay
						key={layer.name}
						name={layer.name}
						checked={layer.checkedByDefault ?? false}
					>
						<WMSTileLayer
							maxZoom={20}
							url={layer.url}
							layers={layer.layers}
							format={layer.format}
							version={layer.version}
							transparent={layer.transparent}
							opacity={layer.opacity}
						/>
					</LayersControl.Overlay>
				))}
			</LayersControl>

			{/* Floating search control */}
			<MapSearchControl
				onSearch={onSearch}
				onClear={onClearSearch}
				isLoading={isSearchLoading}
			/>

			{/* Screenshot control (bottom-left) */}
			<MapScreenshotControl onScreenshot={onScreenshot} />

			{/* Resize handler for side-panel */}
			<ResizeOnPanel open={panelOpen} />

			{/* Offset topright controls to avoid panel & toggle button overlap */}
			<AdjustTopRightControls open={panelOpen} width={panelWidth} />

			{/* Click handler */}
			{onMapClick && <MapClickHandler onClick={onMapClick} />}

			{/* Fly-to animation */}
			{flyToTarget && (
				<FlyTo center={flyToTarget.center} zoom={flyToTarget.zoom} />
			)}

			{/* Fit-bounds animation (multi-property) */}
			{fitBoundsTarget && <FitBounds bounds={fitBoundsTarget} />}

			{/* Single address / click marker */}
			{addressMarker && (
				<Marker position={addressMarker.position} icon={faLocationIcon}>
					{addressMarker.label && <Popup>{addressMarker.label}</Popup>}
				</Marker>
			)}
		</MapContainer>
	);
}
