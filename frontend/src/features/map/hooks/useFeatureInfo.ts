/**
 * useFeatureInfo — fetches GetFeatureInfo data for the active property.
 *
 * Queries the backend /api/v1/feature-info endpoint which aggregates
 * all WMS + ArcGIS REST calls server-side and returns parsed FeatureInfoData.
 * Results are cached in the featureInfo store per matrikkel key.
 */

import { useEffect, useRef } from "react";
import { z } from "zod";
import { FeatureInfoDataSchema } from "../api/schemas";
import type {
	FeatureInfoEntry,
} from "../domain/featureInfoTypes";
import { useFeatureInfoStore } from "../stores/featureInfo.store";
import type { SelectedProperty } from "../stores/propertySelection.store";

/* ------------------------------------------------------------------ */
/*  Backend fetch                                                        */
/* ------------------------------------------------------------------ */

async function fetchAllFeatureInfo(
	lat: number,
	lng: number,
): Promise<z.infer<typeof FeatureInfoDataSchema>> {
	const url = `/api/v1/feature-info?lat=${lat}&lng=${lng}`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Feature info request failed (${response.status}): ${response.statusText}`,
		);
	}
	const raw = await response.json();
	return FeatureInfoDataSchema.parse(raw);
}

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * Fetches and caches GetFeatureInfo data for the given property.
 * Returns the current cache entry (loading/loaded/error) or undefined.
 */
export function useFeatureInfo(
	activeItem: { item: SelectedProperty; index: number } | null,
): FeatureInfoEntry | undefined {
	const cache = useFeatureInfoStore((s) => s.cache);
	const setLoading = useFeatureInfoStore((s) => s.setLoading);
	const setLoaded = useFeatureInfoStore((s) => s.setLoaded);
	const setError = useFeatureInfoStore((s) => s.setError);

	const key = activeItem?.item.key ?? null;
	const lat = activeItem?.item.property.position.lat ?? null;
	const lng = activeItem?.item.property.position.lng ?? null;

	useEffect(() => {
		if (!key || lat === null || lng === null) return;

		// Already cached — skip
		const existing = cache[key];
		if (existing && existing.status !== "error") return;

		let cancelled = false;

		setLoading(key);

		fetchAllFeatureInfo(lat, lng)
			.then((data) => {
				if (!cancelled) setLoaded(key, data);
			})
			.catch((err) => {
				if (!cancelled) {
					setError(
						key,
						err instanceof Error ? err.message : "Ukjent feil ved datahenting",
					);
				}
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, lat, lng]);

	return key ? cache[key] : undefined;
}

/* ------------------------------------------------------------------ */
/*  Batch pre-fetch hook                                                */
/* ------------------------------------------------------------------ */

/**
 * Pre-fetches GetFeatureInfo data for ALL selected properties in the
 * background. When the user switches active property, the data is
 * already cached — no loading spinner needed.
 *
 * Fetches are staggered with a small delay to avoid overwhelming the backend.
 */
export function useBatchFeatureInfo(selected: SelectedProperty[]): void {
	const cache = useFeatureInfoStore((s) => s.cache);
	const setLoading = useFeatureInfoStore((s) => s.setLoading);
	const setLoaded = useFeatureInfoStore((s) => s.setLoaded);
	const setError = useFeatureInfoStore((s) => s.setError);

	const inFlightRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		const uncached = selected.filter((sp) => {
			const entry = cache[sp.key];
			if (entry && entry.status !== "error") return false;
			if (inFlightRef.current.has(sp.key)) return false;
			const { lat, lng } = sp.property.position;
			return lat !== 0 && lng !== 0;
		});

		if (uncached.length === 0) return;

		let cancelled = false;
		const timers: ReturnType<typeof setTimeout>[] = [];

		const MAX_CONCURRENT = 3;
		let running = 0;
		let queueIndex = 0;

		function processNext() {
			while (running < MAX_CONCURRENT && queueIndex < uncached.length) {
				if (cancelled) return;
				const sp = uncached[queueIndex++];
				const key = sp.key;
				const { lat, lng } = sp.property.position;

				inFlightRef.current.add(key);
				setLoading(key);
				running++;

				fetchAllFeatureInfo(lat, lng)
					.then((data) => {
						if (!cancelled) setLoaded(key, data);
					})
					.catch((err) => {
						if (!cancelled) {
							setError(
								key,
								err instanceof Error
									? err.message
									: "Ukjent feil ved datahenting",
							);
						}
					})
					.finally(() => {
						inFlightRef.current.delete(key);
						running--;
						if (!cancelled && queueIndex < uncached.length) {
							const t = setTimeout(processNext, 200);
							timers.push(t);
						}
					});
			}
		}

		const startTimer = setTimeout(processNext, 500);
		timers.push(startTimer);

		return () => {
			cancelled = true;
			for (const t of timers) clearTimeout(t);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected.map((s) => s.key).join(",")]);
}
