import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PROPERTY_COLOURS } from "../domain/constants";
import type { Address, Property, PropertyLookupResult } from "../domain/types";
import { matrikkelKey } from "../domain/types";

/* Re-export so existing consumers don't break */
export { PROPERTY_COLOURS } from "../domain/constants";
export { matrikkelKey } from "../domain/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SelectedProperty = {
	/** Stable key for dedup + React keys */
	key: string;
	property: Property;
	/** Resolved address, if any */
	address?: Address;
	/** Colour index into PROPERTY_COLOURS (by list position) */
	colourIndex: number;
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface PropertySelectionState {
	/** Active project id — properties are scoped per project */
	activeProjectId: string;
	/** Project-scoped property selections: projectId → SelectedProperty[] */
	projects: Record<string, SelectedProperty[]>;
	/** Side-panel open/closed */
	panelOpen: boolean;
	/** Panel width in px (for pointer-drag resize) */
	panelWidth: number;
	/** True while the user drags the resize handle */
	panelResizing: boolean;

	/** Latest map screenshot as base64 string (no data-URI prefix) */
	screenshotBase64: string | null;

	/** Key of the currently-active property for analysis tabs (Generelt/Klima/Risiko) */
	activeKey: string | null;

	/* Computed helper (not persisted — derived) */
	/** Shorthand: the selected properties for the active project */
	selected: SelectedProperty[];

	/* Actions */
	setActiveProject: (projectId: string) => void;
	addResult: (result: PropertyLookupResult) => void;
	removeByKey: (key: string) => void;
	moveUp: (index: number) => void;
	moveDown: (index: number) => void;
	clearAll: () => void;
	setActiveKey: (key: string | null) => void;
	togglePanel: () => void;
	setPanelOpen: (open: boolean) => void;
	setPanelWidth: (width: number) => void;
	setPanelResizing: (resizing: boolean) => void;
	setScreenshot: (base64: string | null) => void;
	clearScreenshot: () => void;
}

export const PANEL_MIN_WIDTH = 320;
export const PANEL_MAX_WIDTH = 720;
export const PANEL_DEFAULT_WIDTH = 400;

/** Reassign colour indices by list position */
function recolour(list: SelectedProperty[]): SelectedProperty[] {
	return list.map((item, i) => ({
		...item,
		colourIndex: i % PROPERTY_COLOURS.length,
	}));
}

/** Default project id used when no explicit project is set */
export const DEFAULT_PROJECT_ID = "default";

/** Helper: get the selected list for the active project */
function getSelected(state: {
	activeProjectId: string;
	projects: Record<string, SelectedProperty[]>;
}): SelectedProperty[] {
	return state.projects[state.activeProjectId] ?? [];
}

/** Helper: set the selected list for the active project and derive `selected` */
function setProjectList(
	state: {
		activeProjectId: string;
		projects: Record<string, SelectedProperty[]>;
	},
	list: SelectedProperty[],
) {
	return {
		projects: { ...state.projects, [state.activeProjectId]: list },
		selected: list,
	};
}

export const usePropertySelectionStore = create<PropertySelectionState>()(
	persist(
		(set, get) => ({
			activeProjectId: DEFAULT_PROJECT_ID,
			projects: {},
			selected: [],
			panelOpen: true,
			panelWidth: PANEL_DEFAULT_WIDTH,
			panelResizing: false,
			screenshotBase64: null,
			activeKey: null,

			setActiveProject: (projectId) => {
				const { projects } = get();
				set({
					activeProjectId: projectId,
					selected: projects[projectId] ?? [],
				});
			},

			addResult: (result) => {
				const state = get();
				const selected = getSelected(state);
				const existingKeys = new Set(selected.map((s) => s.key));
				const newItems: SelectedProperty[] = [];

				for (const prop of result.properties) {
					const key = matrikkelKey(prop);
					if (existingKeys.has(key)) continue;
					existingKeys.add(key);
					newItems.push({
						key,
						property: prop,
						address: result.address,
						colourIndex: 0, // will be recoloured
					});
				}

				if (newItems.length === 0) return;
				const updated = recolour([...selected, ...newItems]);
				set(setProjectList(state, updated));
			},

			removeByKey: (key) => {
				const state = get();
				const updated = recolour(
					getSelected(state).filter((s) => s.key !== key),
				);
				const patch: Partial<PropertySelectionState> = setProjectList(
					state,
					updated,
				);
				// Clear activeKey if the removed property was active
				if (state.activeKey === key) patch.activeKey = null;
				set(patch);
			},

			moveUp: (index) => {
				const state = get();
				const list = [...getSelected(state)];
				if (index <= 0 || index >= list.length) return;
				[list[index - 1], list[index]] = [list[index], list[index - 1]];
				set(setProjectList(state, recolour(list)));
			},

			moveDown: (index) => {
				const state = get();
				const list = [...getSelected(state)];
				if (index < 0 || index >= list.length - 1) return;
				[list[index], list[index + 1]] = [list[index + 1], list[index]];
				set(setProjectList(state, recolour(list)));
			},

			clearAll: () => {
				const state = get();
				set({ ...setProjectList(state, []), activeKey: null });
			},

			setActiveKey: (key) => set({ activeKey: key }),

			togglePanel: () => set({ panelOpen: !get().panelOpen }),
			setPanelOpen: (open) => set({ panelOpen: open }),
			setPanelWidth: (width) =>
				set({
					panelWidth: Math.min(
						PANEL_MAX_WIDTH,
						Math.max(PANEL_MIN_WIDTH, width),
					),
				}),
			setPanelResizing: (resizing) => set({ panelResizing: resizing }),
			setScreenshot: (base64) => set({ screenshotBase64: base64 }),
			clearScreenshot: () => set({ screenshotBase64: null }),
		}),
		{
			name: "no-ask-property-selection",
			partialize: (state) => ({
				activeProjectId: state.activeProjectId,
				projects: state.projects,
				panelOpen: state.panelOpen,
				panelWidth: state.panelWidth,
				screenshotBase64: state.screenshotBase64,
				activeKey: state.activeKey,
			}),
			merge: (persisted, current) => {
				const merged = {
					...current,
					...(persisted as Partial<PropertySelectionState>),
				};
				// Derive `selected` from persisted project data
				merged.selected = merged.projects[merged.activeProjectId] ?? [];
				// Validate activeKey still exists in selected list
				if (
					merged.activeKey &&
					!merged.selected.some((s) => s.key === merged.activeKey)
				) {
					merged.activeKey = null;
				}
				return merged;
			},
		},
	),
);
