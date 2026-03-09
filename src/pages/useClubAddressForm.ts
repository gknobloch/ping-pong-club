import { useState } from 'react'
import type { Address } from '@/types'

export type ClubAddressFormState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; address: Address }

export function useClubAddressFormState() {
  return useState<ClubAddressFormState>(null)
}
