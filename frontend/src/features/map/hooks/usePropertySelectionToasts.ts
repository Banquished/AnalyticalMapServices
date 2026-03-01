import { useEffect } from 'react'
import { useToastStore } from '@/shared/ui/toast'

/**
 * Shows toast notifications for property search outcomes.
 *
 * @param searchError - Error message from text/matrikkel search, or null
 * @param clickError  - Error message from map-click search, or null
 * @param showNoResults - True when a search completed with zero results
 */
export function usePropertySelectionToasts(
  searchError: string | null,
  clickError: string | null,
  showNoResults: boolean,
): void {
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    if (searchError) addToast('warning', searchError)
  }, [searchError, addToast])

  useEffect(() => {
    if (clickError) addToast('warning', clickError)
  }, [clickError, addToast])

  useEffect(() => {
    if (showNoResults) addToast('attention', 'Fant ingen eiendommer for dette søket.')
  }, [showNoResults, addToast])
}
