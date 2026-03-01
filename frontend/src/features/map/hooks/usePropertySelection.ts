import { useShallow } from "zustand/react/shallow";
import { usePropertySelectionStore } from "../stores/propertySelection.store";

/**
 * Batched selector for all fields needed by MapPageView.
 * Uses useShallow to avoid unnecessary re-renders.
 */
export function usePropertySelection() {
	return usePropertySelectionStore(
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
}
