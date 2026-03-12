import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Division } from '@/types'
import type {
  Address,
  Club,
  Season,
  Phase,
  Group,
  Team,
  Player,
  MatchDay,
  Game,
  GameAvailability,
  GameSelection,
  AvailabilityStatus,
  AvailabilityOverriddenBy,
  User,
} from '@/types'
import {
  mockDivisions,
  mockClubs,
  mockSeasons,
  mockPhases,
  mockGroups,
  mockTeams,
  mockPlayers,
  mockMatchDays,
  mockGames,
  mockGameAvailabilities,
  mockGameSelections,
  mockUsers,
} from '@/mock/data'

interface DataState {
  divisions: Division[]
  clubs: Club[]
  seasons: Season[]
  phases: Phase[]
  groups: Group[]
  teams: Team[]
  players: Player[]
  matchDays: MatchDay[]
  games: Game[]
  gameAvailabilities: GameAvailability[]
  gameSelections: GameSelection[]
  users: User[]
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function api(path: string, options?: RequestInit) {
  return fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }).catch(console.error)
}

interface DataContextValue extends Omit<DataState, 'users'> {
  updateDivision: (id: string, patch: Partial<Division>) => void
  updateClub: (id: string, patch: Partial<Club>) => void
  archiveClub: (id: string) => void
  addClubAddress: (clubId: string, data: Omit<Address, 'id'>) => Address
  updateClubAddress: (clubId: string, addressId: string, patch: Partial<Address>) => void
  deleteClubAddress: (clubId: string, addressId: string) => void
  updateSeason: (id: string, patch: Partial<Season>) => void
  archiveSeason: (id: string) => void
  deleteSeason: (id: string) => void
  updatePhase: (id: string, patch: Partial<Phase>) => void
  archivePhase: (id: string) => void
  deletePhase: (id: string) => void
  updateGroup: (id: string, patch: Partial<Group>) => void
  updateTeam: (id: string, patch: Partial<Team>) => void
  archiveTeam: (id: string) => void
  deleteTeam: (id: string) => void
  addClub: (data: Omit<Club, 'id'>) => Club
  addSeason: (data: Omit<Season, 'id'>) => Season
  addPhase: (data: Omit<Phase, 'id'>) => Phase
  addDivision: (data: Omit<Division, 'id'>) => Division
  addGroup: (data: Omit<Group, 'id'>) => Group
  addTeam: (data: Omit<Team, 'id'>) => Team
  moveDivisionUp: (divisionId: string) => void
  moveDivisionDown: (divisionId: string) => void
  updatePlayer: (id: string, patch: Partial<Player>) => void
  addPlayer: (data: Omit<Player, 'id'>) => Player
  matchDays: MatchDay[]
  games: Game[]
  updateMatchDay: (id: string, patch: Partial<MatchDay>) => void
  addMatchDay: (data: Omit<MatchDay, 'id'>) => MatchDay
  updateGame: (id: string, patch: Partial<Game>) => void
  addGame: (data: Omit<Game, 'id'>) => Game
  gameAvailabilities: GameAvailability[]
  setGameAvailability: (
    gameId: string,
    playerId: string,
    status: AvailabilityStatus,
    overriddenBy?: AvailabilityOverriddenBy
  ) => void
  clearGameAvailability: (gameId: string, playerId: string) => void
  gameSelections: GameSelection[]
  getGameSelectionPlayerIds: (gameId: string, teamId: string) => string[]
  setGameSelection: (gameId: string, teamId: string, playerIds: string[]) => void
  setGameSelectionBatch: (
    updates: Array<{ gameId: string; teamId: string; playerIds: string[] }>
  ) => void
}

const DataContext = createContext<DataContextValue | null>(null)

interface DataProviderProps {
  children: React.ReactNode
  /** When provided, skip API fetch and use this data (for tests). */
  initialData?: DataState
}

export function DataProvider({ children, initialData }: DataProviderProps) {
  const [divisions, setDivisions] = useState<Division[]>(initialData?.divisions ?? [])
  const [clubs, setClubs] = useState<Club[]>(initialData?.clubs ?? [])
  const [seasons, setSeasons] = useState<Season[]>(initialData?.seasons ?? [])
  const [phases, setPhases] = useState<Phase[]>(initialData?.phases ?? [])
  const [groups, setGroups] = useState<Group[]>(initialData?.groups ?? [])
  const [teams, setTeams] = useState<Team[]>(initialData?.teams ?? [])
  const [players, setPlayers] = useState<Player[]>(initialData?.players ?? [])
  const [matchDays, setMatchDays] = useState<MatchDay[]>(initialData?.matchDays ?? [])
  const [games, setGames] = useState<Game[]>(initialData?.games ?? [])
  const [gameAvailabilities, setGameAvailabilities] = useState<GameAvailability[]>(
    initialData?.gameAvailabilities ?? []
  )
  const [gameSelections, setGameSelections] = useState<GameSelection[]>(
    initialData?.gameSelections ?? []
  )
  const [loading, setLoading] = useState(!initialData)
  const [persist, setPersist] = useState(!initialData)

  useEffect(() => {
    if (initialData) return

    function applyData(data: DataState) {
      setSeasons(data.seasons)
      setPhases(data.phases)
      setDivisions(data.divisions)
      setClubs(data.clubs)
      setGroups(data.groups)
      setTeams(data.teams)
      setPlayers(data.players)
      setMatchDays(data.matchDays)
      setGames(data.games)
      setGameAvailabilities(data.gameAvailabilities)
      setGameSelections(data.gameSelections)
    }

    function fallbackToMock() {
      console.warn('API unavailable, falling back to mock data (no persistence)')
      setPersist(false)
      applyData({
        seasons: mockSeasons, phases: mockPhases, divisions: mockDivisions,
        clubs: mockClubs, groups: mockGroups, teams: mockTeams, players: mockPlayers,
        matchDays: mockMatchDays, games: mockGames,
        gameAvailabilities: mockGameAvailabilities,
        gameSelections: mockGameSelections, users: mockUsers,
      })
    }

    fetch('/api/data')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: DataState) => applyData(data))
      .catch(() => fallbackToMock())
      .finally(() => setLoading(false))
  }, [initialData])

  // --- Seasons ---
  const updateSeason = useCallback((id: string, patch: Partial<Season>) => {
    setSeasons((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    if (persist) api(`/seasons/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addSeason = useCallback((data: Omit<Season, 'id'>) => {
    const id = nextId('season')
    const season: Season = { ...data, id }
    setSeasons((prev) => [...prev, season])
    if (persist) api('/seasons', { method: 'POST', body: JSON.stringify(season) })
    return season
  }, [persist])

  const archiveSeason = useCallback((id: string) => {
    setSeasons((prev) => prev.map((s) => (s.id === id ? { ...s, isArchived: true } : s)))
    if (persist) api(`/seasons/${id}`, { method: 'PATCH', body: JSON.stringify({ isArchived: true }) })
  }, [persist])

  const deleteSeason = useCallback((id: string) => {
    // Cascade: find phases → divisions → groups → teams, match days, games, avail, selections
    const phaseIds = phases.filter((p) => p.seasonId === id).map((p) => p.id)
    const divIds = divisions.filter((d) => phaseIds.includes(d.phaseId)).map((d) => d.id)
    const grpIds = groups.filter((g) => divIds.includes(g.divisionId)).map((g) => g.id)
    const teamIds = teams.filter((t) => phaseIds.includes(t.phaseId)).map((t) => t.id)
    const mdIds = matchDays.filter((md) => grpIds.includes(md.groupId)).map((md) => md.id)
    const gameIds = games.filter((g) => mdIds.includes(g.matchDayId)).map((g) => g.id)

    setGameAvailabilities((prev) => prev.filter((a) => !gameIds.includes(a.gameId)))
    setGameSelections((prev) => prev.filter((s) => !gameIds.includes(s.gameId)))
    setGames((prev) => prev.filter((g) => !gameIds.includes(g.id)))
    setMatchDays((prev) => prev.filter((md) => !mdIds.includes(md.id)))
    setTeams((prev) => prev.filter((t) => !teamIds.includes(t.id)))
    setGroups((prev) => prev.filter((g) => !grpIds.includes(g.id)))
    setDivisions((prev) => prev.filter((d) => !divIds.includes(d.id)))
    setPhases((prev) => prev.filter((p) => !phaseIds.includes(p.id)))
    setSeasons((prev) => prev.filter((s) => s.id !== id))
    if (persist) api(`/seasons/${id}`, { method: 'DELETE' })
  }, [persist, phases, divisions, groups, teams, matchDays, games])

  // --- Phases ---
  const updatePhase = useCallback((id: string, patch: Partial<Phase>) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    if (persist) api(`/phases/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addPhase = useCallback((data: Omit<Phase, 'id'>) => {
    const id = nextId('phase')
    const phase: Phase = { ...data, id }
    setPhases((prev) => [...prev, phase])
    if (persist) api('/phases', { method: 'POST', body: JSON.stringify(phase) })
    return phase
  }, [persist])

  const archivePhase = useCallback((id: string) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, isArchived: true } : p)))
    if (persist) api(`/phases/${id}`, { method: 'PATCH', body: JSON.stringify({ isArchived: true }) })
  }, [persist])

  const deletePhase = useCallback((id: string) => {
    // Cascade: divisions → groups → teams, match days → games → availabilities → selections
    const phaseDivIds = divisions.filter((d) => d.phaseId === id).map((d) => d.id)
    const phaseGroupIds = groups.filter((g) => phaseDivIds.includes(g.divisionId)).map((g) => g.id)
    const phaseMatchDayIds = matchDays.filter((md) => phaseGroupIds.includes(md.groupId)).map((md) => md.id)
    const phaseTeamIds = teams.filter((t) => t.phaseId === id).map((t) => t.id)
    const phaseGameIds = games.filter(
      (g) => phaseMatchDayIds.includes(g.matchDayId) || phaseTeamIds.includes(g.homeTeamId) || phaseTeamIds.includes(g.awayTeamId)
    ).map((g) => g.id)

    setGameSelections((prev) => prev.filter((s) => !phaseGameIds.includes(s.gameId)))
    setGameAvailabilities((prev) => prev.filter((a) => !phaseGameIds.includes(a.gameId)))
    setGames((prev) => prev.filter((g) => !phaseGameIds.includes(g.id)))
    setMatchDays((prev) => prev.filter((md) => !phaseMatchDayIds.includes(md.id)))
    setTeams((prev) => prev.filter((t) => !phaseTeamIds.includes(t.id)))
    setGroups((prev) => prev.filter((g) => !phaseGroupIds.includes(g.id)))
    setDivisions((prev) => prev.filter((d) => !phaseDivIds.includes(d.id)))
    setPhases((prev) => prev.filter((p) => p.id !== id))
    if (persist) api(`/phases/${id}`, { method: 'DELETE' })
  }, [persist, divisions, groups, matchDays, teams, games])

  // --- Divisions ---
  const updateDivision = useCallback((id: string, patch: Partial<Division>) => {
    setDivisions((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    if (persist) api(`/divisions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addDivision = useCallback((data: Omit<Division, 'id'>) => {
    const id = nextId('div')
    const division: Division = { ...data, id }
    setDivisions((prev) => [...prev, division])
    if (persist) api('/divisions', { method: 'POST', body: JSON.stringify(division) })
    return division
  }, [persist])

  const moveDivisionUp = useCallback((divisionId: string) => {
    setDivisions((prev) => {
      const div = prev.find((d) => d.id === divisionId)
      if (!div) return prev
      const inPhase = prev.filter((d) => d.phaseId === div.phaseId).sort((a, b) => a.rank - b.rank)
      const idx = inPhase.findIndex((d) => d.id === divisionId)
      if (idx <= 0) return prev
      const other = inPhase[idx - 1]
      if (persist) {
        api(`/divisions/${divisionId}/move`, {
          method: 'POST',
          body: JSON.stringify({ otherId: other.id, myNewRank: other.rank, otherNewRank: div.rank }),
        })
      }
      return prev.map((d) =>
        d.id === div.id ? { ...d, rank: other.rank } : d.id === other.id ? { ...d, rank: div.rank } : d
      )
    })
  }, [persist])

  const moveDivisionDown = useCallback((divisionId: string) => {
    setDivisions((prev) => {
      const div = prev.find((d) => d.id === divisionId)
      if (!div) return prev
      const inPhase = prev.filter((d) => d.phaseId === div.phaseId).sort((a, b) => a.rank - b.rank)
      const idx = inPhase.findIndex((d) => d.id === divisionId)
      if (idx < 0 || idx >= inPhase.length - 1) return prev
      const other = inPhase[idx + 1]
      if (persist) {
        api(`/divisions/${divisionId}/move`, {
          method: 'POST',
          body: JSON.stringify({ otherId: other.id, myNewRank: other.rank, otherNewRank: div.rank }),
        })
      }
      return prev.map((d) =>
        d.id === div.id ? { ...d, rank: other.rank } : d.id === other.id ? { ...d, rank: div.rank } : d
      )
    })
  }, [persist])

  // --- Clubs ---
  const updateClub = useCallback((id: string, patch: Partial<Club>) => {
    setClubs((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    if (persist) api(`/clubs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addClub = useCallback((data: Omit<Club, 'id'>) => {
    const id = nextId('club')
    const club: Club = { ...data, id }
    setClubs((prev) => [...prev, club])
    if (persist) api('/clubs', { method: 'POST', body: JSON.stringify(club) })
    return club
  }, [persist])

  const archiveClub = useCallback((id: string) => {
    setClubs((prev) => prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c)))
    if (persist) api(`/clubs/${id}`, { method: 'PATCH', body: JSON.stringify({ isArchived: true }) })
  }, [persist])

  const addClubAddress = useCallback((clubId: string, data: Omit<Address, 'id'>) => {
    const id = nextId('addr')
    const address: Address = { ...data, id }
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== clubId) return c
        const addresses = c.addresses ?? []
        const newAddresses = data.isDefault
          ? [...addresses.map((a) => ({ ...a, isDefault: false })), address]
          : addresses.length === 0
            ? [{ ...address, isDefault: true }]
            : [...addresses, address]
        return { ...c, addresses: newAddresses }
      })
    )
    if (persist) api(`/clubs/${clubId}/addresses`, { method: 'POST', body: JSON.stringify(address) })
    return address
  }, [persist])

  const updateClubAddress = useCallback(
    (clubId: string, addressId: string, patch: Partial<Address>) => {
      setClubs((prev) =>
        prev.map((c) => {
          if (c.id !== clubId) return c
          const addresses = (c.addresses ?? []).map((a) =>
            a.id === addressId ? { ...a, ...patch } : patch.isDefault === true ? { ...a, isDefault: false } : a
          )
          return { ...c, addresses }
        })
      )
      if (persist) api(`/clubs/${clubId}/addresses/${addressId}`, { method: 'PATCH', body: JSON.stringify(patch) })
    },
    [persist]
  )

  const deleteClubAddress = useCallback((clubId: string, addressId: string) => {
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== clubId) return c
        let addresses = (c.addresses ?? []).filter((a) => a.id !== addressId)
        const deletedWasDefault = (c.addresses ?? []).find((a) => a.id === addressId)?.isDefault
        if (deletedWasDefault && addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
          addresses = [{ ...addresses[0], isDefault: true }, ...addresses.slice(1)]
        }
        return { ...c, addresses }
      })
    )
    if (persist) api(`/clubs/${clubId}/addresses/${addressId}`, { method: 'DELETE' })
  }, [persist])

  // --- Groups ---
  const updateGroup = useCallback((id: string, patch: Partial<Group>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
    if (persist) api(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addGroup = useCallback((data: Omit<Group, 'id'>) => {
    const id = nextId('group')
    const group: Group = { ...data, id }
    setGroups((prev) => [...prev, group])
    if (persist) api('/groups', { method: 'POST', body: JSON.stringify(group) })
    return group
  }, [persist])

  // --- Teams ---
  const updateTeam = useCallback((id: string, patch: Partial<Team>) => {
    setTeams((prev) => {
      const team = prev.find((t) => t.id === id)
      if (!team) return prev
      const nextPlayerIds = patch.playerIds ?? team.playerIds ?? []
      const phaseId = patch.phaseId ?? team.phaseId
      const rosterInitialPoints = patch.rosterInitialPoints ?? team.rosterInitialPoints
      const otherTeamsInPhase = prev.filter(
        (t) => t.phaseId === phaseId && t.id !== id
      )
      const batchUpdates: Array<{ id: string; playerIds: string[]; rosterInitialPoints?: Record<string, string> }> = []
      for (const other of otherTeamsInPhase) {
        const otherIds = other.playerIds ?? []
        const removed = otherIds.filter((pid) => nextPlayerIds.includes(pid))
        if (removed.length > 0) {
          const nextIds = otherIds.filter((pid) => !nextPlayerIds.includes(pid))
          const nextPoints = { ...other.rosterInitialPoints }
          removed.forEach((pid) => delete nextPoints[pid])
          batchUpdates.push({
            id: other.id,
            playerIds: nextIds,
            rosterInitialPoints: Object.keys(nextPoints).length ? nextPoints : undefined,
          })
        }
      }
      if (persist) {
        api(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify({ ...patch, rosterInitialPoints }) })
        if (batchUpdates.length) {
          api('/teams/batch', { method: 'POST', body: JSON.stringify({ updates: batchUpdates }) })
        }
      }
      return prev.map((t) => {
        if (t.id === id) return { ...t, ...patch, rosterInitialPoints }
        const u = batchUpdates.find((u) => u.id === t.id)
        if (u) return { ...t, playerIds: u.playerIds, rosterInitialPoints: u.rosterInitialPoints }
        return t
      })
    })
  }, [persist])

  const addTeam = useCallback((data: Omit<Team, 'id'>) => {
    const id = nextId('team')
    const team: Team = { ...data, id }
    setTeams((prev) => {
      const phaseId = team.phaseId
      const newPlayerIds = team.playerIds ?? []
      const otherTeamsInPhase = prev.filter((t) => t.phaseId === phaseId)
      const batchUpdates: Array<{ id: string; playerIds: string[]; rosterInitialPoints?: Record<string, string> }> = []
      const updated = prev.map((t) => {
        if (!otherTeamsInPhase.includes(t)) return t
        const otherIds = t.playerIds ?? []
        const removed = otherIds.filter((pid) => newPlayerIds.includes(pid))
        if (removed.length === 0) return t
        const nextIds = otherIds.filter((pid) => !newPlayerIds.includes(pid))
        const nextPoints = { ...t.rosterInitialPoints }
        removed.forEach((pid) => delete nextPoints[pid])
        batchUpdates.push({
          id: t.id,
          playerIds: nextIds,
          rosterInitialPoints: Object.keys(nextPoints).length ? nextPoints : undefined,
        })
        return {
          ...t,
          playerIds: nextIds,
          rosterInitialPoints: Object.keys(nextPoints).length ? nextPoints : undefined,
        }
      })
      if (persist) {
        api('/teams', { method: 'POST', body: JSON.stringify(team) })
        if (batchUpdates.length) {
          api('/teams/batch', { method: 'POST', body: JSON.stringify({ updates: batchUpdates }) })
        }
      }
      return [...updated, team]
    })
    return team
  }, [persist])

  const archiveTeam = useCallback((id: string) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, isArchived: true } : t)))
    if (persist) api(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify({ isArchived: true }) })
  }, [persist])

  const deleteTeam = useCallback((id: string) => {
    const team = teams.find((t) => t.id === id)
    // Remove team from group teamIds
    if (team) {
      const group = groups.find((g) => g.id === team.groupId)
      if (group) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === group.id ? { ...g, teamIds: g.teamIds.filter((tid) => tid !== id) } : g
          )
        )
      }
    }
    // Remove games involving this team + their availabilities/selections
    const teamGameIds = games.filter((g) => g.homeTeamId === id || g.awayTeamId === id).map((g) => g.id)
    if (teamGameIds.length > 0) {
      setGames((prev) => prev.filter((g) => !teamGameIds.includes(g.id)))
      setGameAvailabilities((prev) => prev.filter((a) => !teamGameIds.includes(a.gameId)))
      setGameSelections((prev) => prev.filter((s) => !teamGameIds.includes(s.gameId)))
    }
    setTeams((prev) => prev.filter((t) => t.id !== id))
    if (persist) api(`/teams/${id}`, { method: 'DELETE' })
  }, [persist, teams, groups, games])

  // --- Players ---
  const updatePlayer = useCallback((id: string, patch: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    if (persist) api(`/players/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addPlayer = useCallback((data: Omit<Player, 'id'>) => {
    const id = nextId('player')
    const player: Player = { ...data, id }
    setPlayers((prev) => [...prev, player])
    if (persist) api('/players', { method: 'POST', body: JSON.stringify(player) })
    return player
  }, [persist])

  // --- Match Days ---
  const updateMatchDay = useCallback((id: string, patch: Partial<MatchDay>) => {
    setMatchDays((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    if (persist) api(`/match-days/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addMatchDay = useCallback((data: Omit<MatchDay, 'id'>) => {
    const id = nextId('md')
    const matchDay: MatchDay = { ...data, id }
    setMatchDays((prev) => [...prev, matchDay])
    if (persist) api('/match-days', { method: 'POST', body: JSON.stringify(matchDay) })
    return matchDay
  }, [persist])

  // --- Games ---
  const updateGame = useCallback((id: string, patch: Partial<Game>) => {
    setGames((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
    if (persist) api(`/games/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }, [persist])

  const addGame = useCallback((data: Omit<Game, 'id'>) => {
    const id = nextId('game')
    const game: Game = { ...data, id }
    setGames((prev) => [...prev, game])
    if (persist) api('/games', { method: 'POST', body: JSON.stringify(game) })
    return game
  }, [persist])

  // --- Game Availabilities ---
  const setGameAvailability = useCallback(
    (
      gameId: string,
      playerId: string,
      status: AvailabilityStatus,
      overriddenBy?: AvailabilityOverriddenBy
    ) => {
      setGameAvailabilities((prev) => {
        const existing = prev.find(
          (a) => a.gameId === gameId && a.playerId === playerId
        )
        if (existing) {
          if (persist) {
            api('/game-availabilities/set', {
              method: 'POST',
              body: JSON.stringify({ id: existing.id, gameId, playerId, status, overriddenBy }),
            })
          }
          return prev.map((a) =>
            a.id === existing.id ? { ...a, status, overriddenBy } : a
          )
        }
        const id = nextId('avail')
        if (persist) {
          api('/game-availabilities/set', {
            method: 'POST',
            body: JSON.stringify({ id, gameId, playerId, status, overriddenBy }),
          })
        }
        return [...prev, { id, gameId, playerId, status, overriddenBy }]
      })
    },
    [persist]
  )

  const clearGameAvailability = useCallback((gameId: string, playerId: string) => {
    setGameAvailabilities((prev) =>
      prev.filter((a) => !(a.gameId === gameId && a.playerId === playerId))
    )
    if (persist) api('/game-availabilities/clear', { method: 'POST', body: JSON.stringify({ gameId, playerId }) })
  }, [persist])

  // --- Game Selections ---
  const getGameSelectionPlayerIds = useCallback((gameId: string, teamId: string) => {
    return (
      gameSelections.find((s) => s.gameId === gameId && s.teamId === teamId)?.playerIds ?? []
    )
  }, [gameSelections])

  const setGameSelection = useCallback((gameId: string, teamId: string, playerIds: string[]) => {
    setGameSelections((prev) => {
      const rest = prev.filter((s) => !(s.gameId === gameId && s.teamId === teamId))
      if (playerIds.length === 0) {
        if (persist) api('/game-selections/set', { method: 'POST', body: JSON.stringify({ gameId, teamId, playerIds: [] }) })
        return rest
      }
      const existing = prev.find((s) => s.gameId === gameId && s.teamId === teamId)
      const id = existing?.id ?? nextId('gs')
      if (persist) api('/game-selections/set', { method: 'POST', body: JSON.stringify({ id, gameId, teamId, playerIds }) })
      return [
        ...rest,
        existing
          ? { ...existing, playerIds }
          : { id, gameId, teamId, playerIds },
      ]
    })
  }, [persist])

  const setGameSelectionBatch = useCallback(
    (updates: Array<{ gameId: string; teamId: string; playerIds: string[] }>) => {
      setGameSelections((prev) => {
        let next = prev
        const apiUpdates: Array<{ id: string; gameId: string; teamId: string; playerIds: string[] }> = []
        for (const { gameId, teamId, playerIds } of updates) {
          next = next.filter((s) => !(s.gameId === gameId && s.teamId === teamId))
          if (playerIds.length > 0) {
            const existing = prev.find((s) => s.gameId === gameId && s.teamId === teamId)
            const id = existing?.id ?? nextId('gs')
            next = [
              ...next,
              existing
                ? { ...existing, playerIds }
                : { id, gameId, teamId, playerIds },
            ]
            apiUpdates.push({ id, gameId, teamId, playerIds })
          } else {
            apiUpdates.push({ id: '', gameId, teamId, playerIds: [] })
          }
        }
        if (persist) api('/game-selections/batch', { method: 'POST', body: JSON.stringify({ updates: apiUpdates }) })
        return next
      })
    },
    [persist]
  )

  const value = useMemo<DataContextValue>(
    () => ({
      divisions,
      clubs,
      seasons,
      phases,
      groups,
      teams,
      players,
      matchDays,
      games,
      updateDivision,
      updateClub,
      archiveClub,
      addClubAddress,
      updateClubAddress,
      deleteClubAddress,
      updateSeason,
      archiveSeason,
      deleteSeason,
      updatePhase,
      archivePhase,
      deletePhase,
      updateGroup,
      updateTeam,
      archiveTeam,
      deleteTeam,
      addClub,
      addSeason,
      addPhase,
      addDivision,
      addGroup,
      addTeam,
      moveDivisionUp,
      moveDivisionDown,
      updatePlayer,
      addPlayer,
      updateMatchDay,
      addMatchDay,
      updateGame,
      addGame,
      gameAvailabilities,
      setGameAvailability,
      clearGameAvailability,
      gameSelections,
      getGameSelectionPlayerIds,
      setGameSelection,
      setGameSelectionBatch,
    }),
    [
      divisions, clubs, seasons, phases, groups, teams, players,
      matchDays, games,
      updateDivision, updateClub, archiveClub, addClubAddress, updateClubAddress, deleteClubAddress,
      updateSeason, archiveSeason, deleteSeason, updatePhase, archivePhase, deletePhase, updateGroup, updateTeam, archiveTeam, deleteTeam,
      addClub, addSeason, addPhase, addDivision, addGroup, addTeam,
      moveDivisionUp, moveDivisionDown,
      updatePlayer, addPlayer,
      updateMatchDay, addMatchDay, updateGame, addGame,
      gameAvailabilities, setGameAvailability, clearGameAvailability,
      gameSelections, getGameSelectionPlayerIds, setGameSelection, setGameSelectionBatch,
    ]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAppData must be used within DataProvider')
  return ctx
}
