/** Sort an array of objects by lastName then firstName, case-insensitively (French locale). */
export function sortByName<T extends { lastName: string; firstName: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' })
    return last !== 0 ? last : a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
  })
}
