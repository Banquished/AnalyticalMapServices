import type React from "react";
import { X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";

/* Note: Side-panel CSS has been extracted to map.css */

/** Clamp a number between lo and hi (module-level, no re-creation). */
function clamp(v: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(hi, v));
}

/* ------------------------------------------------------------------ */
/*  Tab definition                                                     */
/* ------------------------------------------------------------------ */

export type SidePanelTab = {
	id: string;
	label: string;
	icon?: ReactNode;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type SidePanelProps = {
	open: boolean;
	width: number;
	minWidth?: number;
	maxWidth?: number;
	onResize: (width: number) => void;
	onResizingChange: (active: boolean) => void;
	onClose: () => void;
	title?: string;
	/** Tab definitions — omit for a single-content panel (backward compat). */
	tabs?: SidePanelTab[];
	/** Controlled active tab id. If omitted, managed internally. */
	activeTab?: string;
	/** Called when the user clicks a tab. */
	onTabChange?: (tabId: string) => void;
	/**
	 * Render content for the active tab.
	 * Receives the active tab id; return the content ReactNode.
	 * If omitted, `children` is rendered as the content (single-tab mode).
	 */
	renderContent?: (tabId: string) => ReactNode;
	children?: ReactNode;
	/** Content rendered above the footer divider (e.g. screenshot preview) */
	preFooter?: ReactNode;
	/**
	 * Footer rendered below the divider. Can be a static ReactNode (global CTAs)
	 * or a function that receives the active tab id for per-tab footers.
	 */
	footer?: ReactNode | ((tabId: string) => ReactNode);
};

export function SidePanel({
	open,
	width,
	minWidth = 320,
	maxWidth = 720,
	onResize,
	onResizingChange,
	onClose,
	title = "Eiendomsinfo",
	tabs,
	activeTab: controlledTab,
	onTabChange,
	renderContent,
	children,
	preFooter,
	footer,
}: SidePanelProps) {
	const startRef = useRef<{ x: number; w: number } | null>(null);

	/* Internal tab state (used when activeTab prop is not provided) */
	const [internalTab, setInternalTab] = useState(tabs?.[0]?.id ?? "");
	const activeTabId = controlledTab ?? internalTab;

	function handleTabClick(tabId: string) {
		onTabChange?.(tabId);
		if (controlledTab === undefined) setInternalTab(tabId);
	}

	function onPointerDown(e: React.PointerEvent) {
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		startRef.current = { x: e.clientX, w: width };
		onResizingChange(true);
	}

	function onPointerMove(e: React.PointerEvent) {
		if (!startRef.current) return;
		const { x, w } = startRef.current;
		const delta = x - e.clientX;
		onResize(clamp(Math.round(w + delta), minWidth, maxWidth));
	}

	function onPointerUp(e: React.PointerEvent) {
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		startRef.current = null;
		onResizingChange(false);
	}

	/* Resolve content */
	const content =
		renderContent && activeTabId ? renderContent(activeTabId) : children;

	/* Resolve footer — function form gets the active tab id */
	const resolvedFooter =
		typeof footer === "function" ? footer(activeTabId) : footer;

	return (
		<aside
			className="map-side-panel"
			data-open={open}
			style={{ width: open ? width : 0 }}
			role="complementary"
			aria-hidden={!open || undefined}
		>
			{/* Resize handle */}
			<div
				className="map-side-panel__resizer"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize panel"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
			/>

			{/* Panel body */}
			<div className="map-side-panel__body">
				<div className="map-side-panel__header">
					<h2>{title}</h2>
					<button
						type="button"
						className="map-side-panel__close"
						onClick={onClose}
						aria-label="Lukk panel"
						title="Lukk"
					>
						<X size={14} strokeWidth={2} />
					</button>
				</div>

				{/* Tab bar (Sweco tablist pattern) */}
				{tabs && tabs.length > 0 && (
					<div
						className="map-side-panel__tabs tablist tablist-sm"
						role="tablist"
					>
						{tabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								role="tab"
								className={`btn btn-quaternary btn-sm${activeTabId === tab.id ? " active" : ""}`}
								aria-selected={activeTabId === tab.id}
								onClick={() => handleTabClick(tab.id)}
							>
								{tab.icon}
								<span>{tab.label}</span>
							</button>
						))}
					</div>
				)}

				<div className="map-side-panel__content">{content}</div>
				{preFooter && (
					<div className="map-side-panel__pre-footer">{preFooter}</div>
				)}
				{resolvedFooter && (
					<div className="map-side-panel__footer">{resolvedFooter}</div>
				)}
			</div>
		</aside>
	);
}
