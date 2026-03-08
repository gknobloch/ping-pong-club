/**
 * Round-robin tournament: each team plays each other once.
 * Returns an array of rounds; each round is an array of { home, away } pairs.
 * For n teams: n-1 rounds if n even, n rounds if n odd (one bye per round when odd).
 * Spec: 7 or 8 teams → 7 match-days, 6 teams → 5 match-days.
 */
export function roundRobin<T>(teams: T[]): { home: T; away: T }[][] {
  const n = teams.length
  if (n < 2) return []

  const numRounds = n % 2 === 0 ? n - 1 : n
  const size = n % 2 === 0 ? n : n + 1
  const rotating = size - 1

  const indices: (T | null)[] = n % 2 === 0 ? [...teams] : [...teams, null]

  const rounds: { home: T; away: T }[][] = []
  for (let r = 0; r < numRounds; r++) {
    const round: { home: T; away: T }[] = []
    // Fixed team at index 0 plays the one at circle position (rotating - r)
    const oppPos = (rotating - r + rotating) % rotating
    const secondIdx = oppPos === 0 ? rotating : oppPos
    const first = indices[0]
    const second = indices[secondIdx]
    if (first != null && second != null) round.push({ home: first, away: second })

    // Other pairs: circle positions 1..n-1 (1-based); 0 mod (n-1) means position n-1
    for (let i = 1; i < size / 2; i++) {
      const posA = (r + i) % rotating
      const posB = (r + rotating - i) % rotating
      const idxA = posA === 0 ? rotating : posA
      const idxB = posB === 0 ? rotating : posB
      const teamA = indices[idxA]
      const teamB = indices[idxB]
      if (teamA != null && teamB != null) round.push({ home: teamA, away: teamB })
    }
    rounds.push(round)
  }

  return rounds
}

/**
 * Number of match-days for a group of given size (Spec: 8→7, 7→7, 6→5).
 */
export function matchDayCountForGroupSize(n: number): number {
  if (n < 2) return 0
  return n % 2 === 0 ? n - 1 : n
}
