import { describe, it, expect } from 'vitest'
import { getRoleLabel } from './data'

describe('getRoleLabel', () => {
  it('returns French labels for all roles', () => {
    expect(getRoleLabel('general_admin')).toBe('Administrateur général')
    expect(getRoleLabel('club_admin')).toBe('Administrateur de club')
    expect(getRoleLabel('captain')).toBe('Capitaine')
    expect(getRoleLabel('player')).toBe('Joueur')
  })
})
