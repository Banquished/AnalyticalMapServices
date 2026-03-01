/**
 * Feature info cache store.
 *
 * Caches GetFeatureInfo results per matrikkel key to avoid
 * redundant WMS queries when switching between properties.
 */

import { create } from "zustand";
import type {
    FeatureInfoData,
    FeatureInfoEntry,
} from "../domain/featureInfoTypes";

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

interface FeatureInfoState {
	/** Cache: matrikkelKey → FeatureInfoEntry */
	cache: Record<string, FeatureInfoEntry>;

	/* Actions */
	setLoading: (key: string) => void;
	setLoaded: (key: string, data: FeatureInfoData) => void;
	setError: (key: string, error: string) => void;
	getEntry: (key: string) => FeatureInfoEntry | undefined;
	clearEntry: (key: string) => void;
	clearAll: () => void;
}

export const useFeatureInfoStore = create<FeatureInfoState>()((set, get) => ({
	cache: {},

	setLoading: (key) =>
		set((state) => ({
			cache: { ...state.cache, [key]: { status: "loading" } },
		})),

	setLoaded: (key, data) =>
		set((state) => ({
			cache: { ...state.cache, [key]: { status: "loaded", data } },
		})),

	setError: (key, error) =>
		set((state) => ({
			cache: { ...state.cache, [key]: { status: "error", error } },
		})),

	getEntry: (key) => get().cache[key],

	clearEntry: (key) =>
		set((state) => {
			const { [key]: _removed, ...rest } = state.cache;
			void _removed;
			return { cache: rest };
		}),

	clearAll: () => set({ cache: {} }),
}));
