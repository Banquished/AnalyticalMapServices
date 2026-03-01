/**
 * Address and property lookup fetch helpers.
 *
 * Thin wrappers around the backend /api/v1/addresses and
 * /api/v1/properties endpoints. Used by search control hooks.
 */

import { z } from "zod";
import type { OutputAdresseList } from "./types";
import { GeoKodingResponsSchema, OutputAdresseListSchema } from "./schemas";

type Params = Record<string, string | number | boolean | undefined>;

async function backendGet(path: string, params: Params): Promise<unknown> {
	const url = new URL(path, window.location.origin);
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
	}
	const res = await fetch(url.toString());
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new Error(`API error (${res.status}): ${text.slice(0, 200)}`);
	}
	return res.json();
}

export async function searchAddresses(params: Params): Promise<OutputAdresseList> {
	const raw = await backendGet("/api/v1/addresses/search", params);
	return OutputAdresseListSchema.parse(raw);
}

export async function getGeokoding(params: Params): Promise<z.infer<typeof GeoKodingResponsSchema>> {
	const raw = await backendGet("/api/v1/properties/geokoding", params);
	return GeoKodingResponsSchema.parse(raw);
}
