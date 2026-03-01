import { useMemo } from 'react'
import type { FeatureInfoEntry } from '../domain/featureInfoTypes'

export type DotStatus = 'pass' | 'warn' | 'fail' | 'loading' | 'none'

/**
 * Derives per-tab traffic-light statuses from the feature info state.
 *
 * Returns a record keyed by tab ID with a DotStatus value each.
 */
export function useTabStatuses(featureInfo: FeatureInfoEntry | undefined): Record<string, DotStatus> {
  return useMemo((): Record<string, DotStatus> => {
    if (featureInfo === undefined || featureInfo.status === 'loading')
      return { klima: 'loading', risiko: 'loading', miljo: 'loading', generelt: 'loading' }
    if (featureInfo.status === 'error' || featureInfo.status !== 'loaded') return {}

    const d = featureInfo.data
    const klimaFail =
      d.klima &&
      (d.klima.flom50?.inZone ||
        d.klima.flom100?.inZone ||
        d.klima.flom200?.inZone ||
        d.klima.skred100?.inZone ||
        d.risiko?.kvikkleire?.inZone)
    const risikoFail = d.risiko?.radon?.level === 'høy'
    const risikoWarn =
      d.risiko?.radon?.level === 'moderat' ||
      (d.risiko?.stoy?.veg?.length ?? 0) > 0 ||
      d.risiko?.stoy?.jernbane?.inZone ||
      d.risiko?.stoy?.militar !== null
    const miljoFail =
      d.risiko?.naturvern?.hasStrictProtection || d.risiko?.grunnforurensning?.hasHighRisk
    const miljoWarn =
      !miljoFail &&
      ((d.risiko?.kulturminner?.count ?? 0) > 0 ||
        (d.risiko?.naturvern?.count ?? 0) > 0 ||
        (d.risiko?.grunnforurensning?.count ?? 0) > 0)
    const genereltWarn = !!(d.generelt?.planleggingIgangsatt)

    return {
      klima: klimaFail ? 'fail' : d.klima ? 'pass' : 'none',
      risiko: risikoFail ? 'fail' : risikoWarn ? 'warn' : d.risiko ? 'pass' : 'none',
      miljo: miljoFail ? 'fail' : miljoWarn ? 'warn' : 'pass',
      generelt: genereltWarn ? 'warn' : d.generelt ? 'pass' : 'none',
    }
  }, [featureInfo])
}
