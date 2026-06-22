import type { AvailabilityStatus } from '@shared/types'

// Shared availability styling used by the roster pills (GameCard) and the
// Accueil "Ma disponibilité" segmented control (NextMatchCard).
export const ALL_STATUSES: AvailabilityStatus[] = ['available', 'maybe', 'unavailable']

export const AVAIL: Record<
  AvailabilityStatus,
  { short: string; label: string; color: string; bg: string }
> = {
  available:   { short: 'OUI', label: 'Oui',       color: '#16a34a', bg: '#dcfce7' },
  maybe:       { short: 'PE',  label: 'Peut-être', color: '#d97706', bg: '#fef3c7' },
  unavailable: { short: 'NON', label: 'Non',       color: '#dc2626', bg: '#fee2e2' },
}
