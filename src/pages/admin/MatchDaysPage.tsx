import { useState, useMemo, Fragment, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import type { MatchDay, AvailabilityStatus, Player } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { computeBrulage, isPlayerEligibleForTeam } from '@/lib/brulage'

/** Custom team dropdown with colored dots. Options ordered: player's team (if any), empty, then other teams. */
function TeamSelect({
  value,
  onChange,
  optionIds,
  getLabel,
  getColor,
  disabled,
  className = '',
}: {
  value: string | null
  onChange: (teamId: string | null) => void
  optionIds: (string | null)[]
  getLabel: (teamId: string) => string
  getColor: (teamId: string) => string | undefined
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [listRect, setListRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    // Use 'click' not 'mousedown': the list is in a portal (document.body), so ref only
    // contains the button. On mousedown the option would be "outside" and we'd close
    // before the option's click fired, so onChange would never run.
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [open])

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setListRect(null)
      return
    }
    const updateRect = () => {
      if (buttonRef.current) {
        const r = buttonRef.current.getBoundingClientRect()
        setListRect({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 140) })
      }
    }
    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [open])

  const displayLabel = value ? getLabel(value) : '—'
  const displayColor = value ? getColor(value) : undefined

  const dropdownList = open && listRect && (
    <ul
      className="fixed max-h-48 overflow-auto rounded border border-slate-200 bg-white py-1 shadow-lg text-xs z-[100]"
      role="listbox"
      style={{
        top: listRect.top,
        left: listRect.left,
        width: listRect.width,
      }}
    >
      {optionIds.map((id) => {
        const label = id === null ? '—' : getLabel(id)
        const color = id === null ? undefined : getColor(id)
        const isSelected = value === id
        return (
          <li
            key={id ?? '__empty__'}
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              onChange(id)
              setOpen(false)
            }}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
          >
            {color ? (
              <span
                className="shrink-0 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            ) : (
              <span className="shrink-0 w-2.5 h-2.5" aria-hidden />
            )}
            <span className="truncate">{label}</span>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-left text-xs flex items-center gap-1.5 min-h-[26px] hover:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {displayColor && (
          <span
            className="shrink-0 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: displayColor }}
            aria-hidden
          />
        )}
        <span className="truncate">{displayLabel}</span>
        <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdownList && createPortal(dropdownList, document.body)}
    </div>
  )
}

/** Fixed column widths so team tables and Other players table stay aligned. */
const TABLE_COL_WIDTHS = {
  joueur: 160,
  licence: 88,
  points: 64,
  dispo: 64,
  joues: 64,
  brulage: 80,
  matchDayDispo: 96,
  matchDayCompo: 96,
} as const

function MatchDayColgroup({ matchDayCount }: { matchDayCount: number }) {
  return (
    <colgroup>
      <col style={{ width: TABLE_COL_WIDTHS.joueur }} />
      <col style={{ width: TABLE_COL_WIDTHS.licence }} />
      <col style={{ width: TABLE_COL_WIDTHS.points }} />
      <col style={{ width: TABLE_COL_WIDTHS.dispo }} />
      <col style={{ width: TABLE_COL_WIDTHS.joues }} />
      <col style={{ width: TABLE_COL_WIDTHS.brulage }} />
      {Array.from({ length: matchDayCount * 2 }, (_, i) => (
        <col
          key={i}
          style={{
            width: i % 2 === 0 ? TABLE_COL_WIDTHS.matchDayDispo : TABLE_COL_WIDTHS.matchDayCompo,
          }}
        />
      ))}
    </colgroup>
  )
}

export function MatchDaysPage() {
  const { user } = useAuth()
  const {
    phases,
    divisions,
    groups,
    matchDays,
    games,
    teams,
    clubs,
    players,
    gameAvailabilities,
    gameSelections,
    setGameAvailability,
    clearGameAvailability,
    getGameSelectionPlayerIds,
    setGameSelectionBatch,
    addMatchDay,
    updateMatchDay,
    addGame,
    updateGame,
  } = useAppData()
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(phases[0]?.id ?? '')

  /** All teams of the user's club in the selected phase (one block per team; each team has its own group's match-days). */
  const myClubTeamsInPhase = useMemo(() => {
    if (!selectedPhaseId || !user?.clubIds?.length) return []
    return teams
      .filter((t) => t.phaseId === selectedPhaseId && user!.clubIds!.includes(t.clubId))
      .sort((a, b) => (a.groupId === b.groupId ? a.number - b.number : a.groupId.localeCompare(b.groupId)))
  }, [teams, selectedPhaseId, user?.clubIds])

  /** Match-days for a given team (its group). */
  const getMatchDaysForTeam = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return []
    return matchDays
      .filter((m) => m.groupId === team.groupId)
      .sort((a, b) => a.number - b.number)
  }

  /** For "Other players" we use the first team's group match-days. */
  const otherGroupMatchDays = useMemo(() => {
    const first = myClubTeamsInPhase[0]
    if (!first) return []
    return getMatchDaysForTeam(first.id)
  }, [myClubTeamsInPhase, matchDays, teams])

  /** Club players (active) not in any of the phase's team rosters; for "Other players" section. */
  const otherPlayers = useMemo(() => {
    if (!user?.clubIds?.length) return []
    const inRoster = new Set(myClubTeamsInPhase.flatMap((t) => t.playerIds ?? []))
    return players
      .filter(
        (p) =>
          p.clubId &&
          user!.clubIds!.includes(p.clubId) &&
          p.status === 'active' &&
          !inRoster.has(p.id)
      )
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
  }, [players, user?.clubIds, myClubTeamsInPhase])

  const [editingMatchDay, setEditingMatchDay] = useState<MatchDay | null>(null)
  const [creatingMatchDay, setCreatingMatchDay] = useState(false)
  const [matchDayForm, setMatchDayForm] = useState({ groupId: '', number: 1, date: '' })

  /** Opened by clicking a match-day header (J1, J2, …): edit or create game for that team + match-day. */
  const [gameEditModal, setGameEditModal] = useState<{ teamId: string; matchDayId: string } | null>(null)
  const [gameEditForm, setGameEditForm] = useState({
    date: '',
    time: '',
    isHome: true,
    opponentTeamId: '',
  })
  /** Sliding window: which pair of match-days is visible per team (index into that team's group match-days). */
  const [matchDayOffsetByTeamId, setMatchDayOffsetByTeamId] = useState<Record<string, number>>({})
  const [otherMatchDayOffset, setOtherMatchDayOffset] = useState(0)

  const getTeamLabel = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return teamId
    const club = clubs.find((c) => c.id === team.clubId)
    return `${club?.displayName ?? team.clubId} ${team.number}`
  }

  const getTeamSelectLabel = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return teamId
    return `Eq. ${team.number}`
  }

  const getTeamColor = (teamId: string): string | undefined =>
    teams.find((t) => t.id === teamId)?.color

  /** Team options for selection: player's team first (if any), then empty, then all other club teams.
   *  Filters out teams the player is not eligible for (brûlage) on the given match-day. */
  const orderedTeamOptionIds = (playerTeamId: string | null, playerId?: string, matchDayId?: string): (string | null)[] => {
    let all = myClubTeamsInPhase.map((t) => t.id)
    if (playerId && matchDayId) {
      all = all.filter((tid) => {
        const t = teams.find((x) => x.id === tid)
        return t ? isPlayerEligibleForTeam(playerId, t, myClubTeamsInPhase, matchDays, games, gameSelections, matchDayId) : false
      })
    }
    if (playerTeamId && all.includes(playerTeamId)) {
      const rest = all.filter((id) => id !== playerTeamId)
      return [playerTeamId, null, ...rest]
    }
    return [null, ...all]
  }

  const getGroupLabel = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId)
    if (!g) return groupId
    const div = divisions.find((d) => d.id === g.divisionId)
    return div ? `${div.displayName} – Groupe ${g.number}` : `Groupe ${g.number}`
  }

  const getAvailability = (gameId: string, playerId: string): AvailabilityStatus | undefined => {
    const a = gameAvailabilities.find((x) => x.gameId === gameId && x.playerId === playerId)
    return a?.status
  }

  /** Only player (self), captain (their team), or club_admin (their club). Global admin has no edit. */
  const canEditAvailability = (playerId: string, teamId: string): boolean => {
    if (!user) return false
    const team = teams.find((t) => t.id === teamId)
    if (!team) return false
    const isOwn = user.playerId === playerId
    const isCaptain = user.captainTeamIds.includes(teamId)
    const isClubAdminForTeam = user.role === 'club_admin' && user.clubIds.includes(team.clubId)
    return isOwn || isCaptain || isClubAdminForTeam
  }

  const isOverride = (playerId: string, teamId: string): 'captain' | 'club_admin' | undefined => {
    if (!user) return undefined
    const team = teams.find((t) => t.id === teamId)
    if (!team) return undefined
    if (user.playerId === playerId) return undefined
    if (user.captainTeamIds.includes(teamId)) return 'captain'
    if (user.role === 'club_admin' && user.clubIds.includes(team.clubId)) return 'club_admin'
    return undefined
  }

  /** Captain (their team) or club admin (their club) can pick who plays. */
  const canEditGameSelection = (teamId: string): boolean => {
    if (!user) return false
    const team = teams.find((t) => t.id === teamId)
    if (!team) return false
    const isCaptain = user.captainTeamIds.includes(teamId)
    const isClubAdminForTeam = user.role === 'club_admin' && user.clubIds.includes(team.clubId)
    return isCaptain || isClubAdminForTeam
  }

  const availabilityLabel: Record<AvailabilityStatus, string> = {
    available: 'Disponible',
    maybe: 'Peut-être',
    unavailable: 'Indisponible',
  }

  /** Which team (home or away) this player is selected for in this game; null if none. */
  const getSelectedTeamForGame = (gameId: string, playerId: string): string | null => {
    const game = games.find((g) => g.id === gameId)
    if (!game) return null
    if (getGameSelectionPlayerIds(gameId, game.homeTeamId).includes(playerId)) return game.homeTeamId
    if (getGameSelectionPlayerIds(gameId, game.awayTeamId).includes(playerId)) return game.awayTeamId
    return null
  }

  /**
   * Find all match-days with the same number across groups (same "round" in different groups).
   * A player can only play in one team per round, even if teams are in different groups.
   */
  const getCorrespondingMatchDayIds = (matchDayId: string): string[] => {
    const md = matchDays.find((m) => m.id === matchDayId)
    if (!md) return [matchDayId]
    return matchDays.filter((m) => m.number === md.number).map((m) => m.id)
  }

  /** Which team this player is selected for on this match-day round (across all groups); null if none. */
  const getSelectedTeamForMatchDay = (matchDayId: string, playerId: string): string | null => {
    const correspondingIds = getCorrespondingMatchDayIds(matchDayId)
    for (const mdId of correspondingIds) {
      for (const g of games.filter((x) => x.matchDayId === mdId)) {
        const t = getSelectedTeamForGame(g.id, playerId)
        if (t) return t
      }
    }
    return null
  }

  /**
   * Set which team this player is selected for on this match-day round.
   * Player can only be in one team's selection per round: we update all games across
   * corresponding match-days (same number, all groups) in one batch.
   */
  const setPlayerSelectedForMatchDay = (
    matchDayId: string,
    playerId: string,
    teamId: string | null
  ) => {
    const correspondingIds = getCorrespondingMatchDayIds(matchDayId)
    const allDayGames = games.filter((g) => correspondingIds.includes(g.matchDayId))
    const updates: Array<{ gameId: string; teamId: string; playerIds: string[] }> = []
    for (const game of allDayGames) {
      const homeIds = getGameSelectionPlayerIds(game.id, game.homeTeamId).filter((id) => id !== playerId)
      const awayIds = getGameSelectionPlayerIds(game.id, game.awayTeamId).filter((id) => id !== playerId)
      if (teamId === game.homeTeamId) homeIds.push(playerId)
      else if (teamId === game.awayTeamId) awayIds.push(playerId)
      updates.push(
        { gameId: game.id, teamId: game.homeTeamId, playerIds: homeIds },
        { gameId: game.id, teamId: game.awayTeamId, playerIds: awayIds }
      )
    }
    if (updates.length > 0) setGameSelectionBatch(updates)
  }

  const closeMatchDayModal = () => {
    setEditingMatchDay(null)
    setCreatingMatchDay(false)
  }

  const handleSaveMatchDay = () => {
    if (creatingMatchDay && matchDayForm.groupId && matchDayForm.date) {
      addMatchDay({
        groupId: matchDayForm.groupId,
        number: matchDayForm.number,
        date: matchDayForm.date,
      })
      closeMatchDayModal()
    } else if (editingMatchDay) {
      updateMatchDay(editingMatchDay.id, {
        number: matchDayForm.number,
        date: matchDayForm.date,
      })
      closeMatchDayModal()
    }
  }

  const openGameEditModal = (teamId: string, matchDayId: string) => {
    const md = matchDays.find((m) => m.id === matchDayId)
    const team = teams.find((t) => t.id === teamId)
    const game = games.find(
      (g) =>
        g.matchDayId === matchDayId &&
        (g.homeTeamId === teamId || g.awayTeamId === teamId)
    )
    if (!md || !team) return
    setGameEditForm({
      date: md.date,
      time: game?.time ?? team.defaultTime ?? '',
      isHome: game ? game.homeTeamId === teamId : true,
      opponentTeamId: game
        ? game.homeTeamId === teamId
          ? game.awayTeamId
          : game.homeTeamId
        : '',
    })
    setGameEditModal({ teamId, matchDayId })
  }

  const closeGameEditModal = () => setGameEditModal(null)

  const handleSaveGameEdit = () => {
    if (!gameEditModal) return
    const { teamId, matchDayId } = gameEditModal
    const team = teams.find((t) => t.id === teamId)
    const matchDay = matchDays.find((m) => m.id === matchDayId)
    const game = games.find(
      (g) =>
        g.matchDayId === matchDayId &&
        (g.homeTeamId === teamId || g.awayTeamId === teamId)
    )
    if (!team || !matchDay) return
    updateMatchDay(matchDayId, { date: gameEditForm.date })
    const homeTeamId = gameEditForm.isHome ? teamId : gameEditForm.opponentTeamId
    const awayTeamId = gameEditForm.isHome ? gameEditForm.opponentTeamId : teamId
    if (!homeTeamId || !awayTeamId) {
      closeGameEditModal()
      return
    }
    if (game) {
      updateGame(game.id, {
        homeTeamId,
        awayTeamId,
        time: gameEditForm.time || undefined,
      })
    } else {
      addGame({
        matchDayId,
        homeTeamId,
        awayTeamId,
        time: gameEditForm.time || undefined,
      })
    }
    closeGameEditModal()
  }

  const gameEditModalTeam = gameEditModal
    ? teams.find((t) => t.id === gameEditModal.teamId)
    : null
  const gameEditModalMatchDay = gameEditModal
    ? matchDays.find((m) => m.id === gameEditModal!.matchDayId)
    : null
  const gameEditOpponentOptions = gameEditModalTeam
    ? teams.filter(
        (t) =>
          t.groupId === gameEditModalTeam.groupId && t.id !== gameEditModalTeam.id
      )
    : []

  const handlePhaseChange = (phaseId: string) => {
    setSelectedPhaseId(phaseId)
    setMatchDayOffsetByTeamId({})
    setOtherMatchDayOffset(0)
  }

  const scrollToTeam = (teamId: string) => {
    document.getElementById(`team-${teamId}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  /** Groups in this phase where we have at least one team (for "add match day" modal). */
  const groupOptionsInPhase = useMemo(() => {
    return groups.filter((g) => {
      const div = divisions.find((d) => d.id === g.divisionId)
      if (div?.phaseId !== selectedPhaseId) return false
      return g.teamIds.some((tid) => myClubTeamsInPhase.some((t) => t.id === tid))
    })
  }, [groups, divisions, selectedPhaseId, myClubTeamsInPhase])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">
            Disponibilités et compositions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Par équipe : disponibilité et joueurs retenus par match.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPhaseId}
            onChange={(e) => handlePhaseChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
          {myClubTeamsInPhase.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value
                if (id) scrollToTeam(id)
                e.target.value = ''
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              title="Aller à l'équipe"
            >
              <option value="">Aller à l&apos;équipe…</option>
              {myClubTeamsInPhase.map((t) => (
                <option key={t.id} value={t.id}>
                  {getTeamLabel(t.id)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedPhaseId && myClubTeamsInPhase.length === 0 && (
        <p className="text-sm text-slate-600">Aucune équipe de votre club dans cette phase.</p>
      )}

      {myClubTeamsInPhase.map((team) => {
        const groupMatchDays = getMatchDaysForTeam(team.id)
        const offset = matchDayOffsetByTeamId[team.id] ?? 0
        const visibleMatchDays = groupMatchDays.slice(offset, offset + 2)
        const maxOffset = Math.max(0, groupMatchDays.length - 2)
        const roster = (team.playerIds ?? [])
          .map((pid) => players.find((p) => p.id === pid))
          .filter((p): p is Player => p != null)

        const teamGamesCount = groupMatchDays.filter((md) =>
          games.some(
            (g) =>
              g.matchDayId === md.id && (g.homeTeamId === team.id || g.awayTeamId === team.id)
          )
        ).length

        return (
          <section
            key={team.id}
            id={`team-${team.id}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white scroll-mt-4"
          >
            <div
              className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-4"
              style={
                team.color
                  ? { borderLeftWidth: '4px', borderLeftColor: team.color }
                  : undefined
              }
            >
              <h2 className="font-display text-lg font-medium text-slate-800 flex items-center gap-2">
                {team.color && (
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: team.color }}
                    aria-hidden
                  />
                )}
                {getTeamLabel(team.id)}
              </h2>
              {groupMatchDays.length > 2 && (
                <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      setMatchDayOffsetByTeamId((prev) => ({
                        ...prev,
                        [team.id]: Math.max(0, (prev[team.id] ?? 0) - 1),
                      }))
                    }
                    disabled={offset <= 0}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                    aria-label="Journées précédentes"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs text-slate-600 tabular-nums">
                    {offset + 1}–{Math.min(offset + 2, groupMatchDays.length)} / {groupMatchDays.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMatchDayOffsetByTeamId((prev) => ({
                        ...prev,
                        [team.id]: Math.min(maxOffset, (prev[team.id] ?? 0) + 1),
                      }))
                    }
                    disabled={offset >= maxOffset}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                    aria-label="Journées suivantes"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {groupMatchDays.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Aucune journée pour cette équipe. Ajoutez une journée au groupe concerné.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table
                    className="w-full border-collapse text-sm table-fixed"
                    style={{
                      minWidth:
                        TABLE_COL_WIDTHS.joueur +
                        TABLE_COL_WIDTHS.licence +
                        TABLE_COL_WIDTHS.points +
                        TABLE_COL_WIDTHS.dispo +
                        TABLE_COL_WIDTHS.joues +
                        TABLE_COL_WIDTHS.brulage +
                        visibleMatchDays.length *
                          (TABLE_COL_WIDTHS.matchDayDispo + TABLE_COL_WIDTHS.matchDayCompo),
                    }}
                  >
                    <MatchDayColgroup matchDayCount={visibleMatchDays.length} />
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-700">
                          Joueur
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-700">
                          Licence
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-700">
                          Points
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center font-medium text-slate-700">
                          Dispo
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center font-medium text-slate-700">
                          Joués
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center font-medium text-slate-700">
                          Brûlage
                        </th>
                        {visibleMatchDays.map((md) => {
                          const game = games.find(
                            (g) =>
                              g.matchDayId === md.id &&
                              (g.homeTeamId === team.id || g.awayTeamId === team.id)
                          )
                          const opponentId = game
                            ? game.homeTeamId === team.id
                              ? game.awayTeamId
                              : game.homeTeamId
                            : null
                          const isHome = game ? game.homeTeamId === team.id : false
                          return (
                            <th
                              key={md.id}
                              colSpan={2}
                              role="button"
                              tabIndex={0}
                              onClick={() => openGameEditModal(team.id, md.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  openGameEditModal(team.id, md.id)
                                }
                              }}
                              className="whitespace-nowrap border-l border-slate-200 px-2 py-2 text-center font-medium text-slate-700 cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset"
                            >
                              <span className="block">J{md.number}</span>
                              <span className="block text-xs font-normal text-slate-500">
                                {new Date(md.date + 'Z').toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                                {(game?.time ?? team.defaultTime) && (
                                  <span className="ml-1">{game?.time ?? team.defaultTime}</span>
                                )}
                              </span>
                              {opponentId && (
                                <span className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-600">
                                  <span
                                    className="shrink-0 text-slate-500"
                                    title={isHome ? 'Domicile' : 'Extérieur'}
                                  >
                                    {isHome ? (
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                      </svg>
                                    ) : (
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                      </svg>
                                    )}
                                  </span>
                                  {getTeamLabel(opponentId)}
                                </span>
                              )}
                            </th>
                          )
                        })}
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-600">
                        <th colSpan={6} className="px-3 py-1"></th>
                        {visibleMatchDays.map((md) => (
                          <Fragment key={md.id}>
                            <th className="border-l border-slate-200 px-1 py-1 text-center font-normal">
                              Dispo
                            </th>
                            <th className="border-l border-slate-200 px-1 py-1 text-center font-normal">
                              Compo
                            </th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((player) => {
                        const availCount = groupMatchDays.filter((md) => {
                          const game = games.find(
                            (g) =>
                              g.matchDayId === md.id &&
                              (g.homeTeamId === team.id || g.awayTeamId === team.id)
                          )
                          if (!game) return false
                          const s = getAvailability(game.id, player.id)
                          return s === 'available'
                        }).length
                        const selectedCount = groupMatchDays.filter((md) => {
                          const game = games.find(
                            (g) =>
                              g.matchDayId === md.id &&
                              (g.homeTeamId === team.id || g.awayTeamId === team.id)
                          )
                          return game && getGameSelectionPlayerIds(game.id, team.id).includes(player.id)
                        }).length
                        const brulage = computeBrulage(
                          player.id,
                          myClubTeamsInPhase,
                          matchDays,
                          games,
                          gameSelections,
                        )
                        const brulageColor = brulage.burnedIntoTeamId
                          ? getTeamColor(brulage.burnedIntoTeamId)
                          : undefined
                        const brulageTeam = brulage.burnedIntoTeamId
                          ? teams.find((t) => t.id === brulage.burnedIntoTeamId)
                          : null
                        return (
                          <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                              <span className={player.id === team.captainId ? 'font-bold' : ''}>
                                {player.firstName} {player.lastName}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {player.licenseNumber || '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {(team.rosterInitialPoints?.[player.id] ?? player.points) || '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-center text-slate-600">
                              {availCount}/{teamGamesCount}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-center text-slate-600">
                              {selectedCount}/{teamGamesCount}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-center text-slate-600 text-xs">
                              {brulageTeam ? (
                                <span className="inline-flex items-center gap-1">
                                  {brulageColor && (
                                    <span
                                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: brulageColor }}
                                      aria-hidden
                                    />
                                  )}
                                  Equipe {brulageTeam.number}
                                </span>
                              ) : '—'}
                            </td>
                            {visibleMatchDays.map((md) => {
                              const game = games.find(
                                (g) =>
                                  g.matchDayId === md.id &&
                                  (g.homeTeamId === team.id || g.awayTeamId === team.id)
                              )
                              if (!game) {
                                const dayGames = games.filter((g) => g.matchDayId === md.id)
                                const ourClubTeamsThisDay = [
                                  ...new Set(
                                    dayGames.flatMap((g) =>
                                      [g.homeTeamId, g.awayTeamId].filter((tid) =>
                                        user?.clubIds?.includes(
                                          teams.find((t) => t.id === tid)?.clubId ?? ''
                                        )
                                      )
                                    )
                                  ),
                                ]
                                const selectedTeamId = getSelectedTeamForMatchDay(md.id, player.id)
                                const canEditSel = ourClubTeamsThisDay.some((tid) =>
                                  canEditGameSelection(tid)
                                )
                                return (
                                  <Fragment key={md.id}>
                                    <td className="border-l border-slate-100 px-2 py-1.5 text-center text-slate-400">
                                      —
                                    </td>
                                    <td className="border-l border-slate-100 px-2 py-1.5">
                                      {canEditSel && myClubTeamsInPhase.length > 0 ? (
                                        <TeamSelect
                                          value={selectedTeamId}
                                          onChange={(v) =>
                                            setPlayerSelectedForMatchDay(md.id, player.id, v)
                                          }
                                          optionIds={orderedTeamOptionIds(team.id, player.id, md.id)}
                                          getLabel={getTeamSelectLabel}
                                          getColor={getTeamColor}
                                        />
                                      ) : (
                                        <span className="text-xs text-slate-600">
                                          {selectedTeamId ? getTeamSelectLabel(selectedTeamId) : '—'}
                                        </span>
                                      )}
                                    </td>
                                  </Fragment>
                                )
                              }
                              const status = getAvailability(game.id, player.id)
                              const canEditAv = canEditAvailability(player.id, team.id)
                              const selectedTeamId = getSelectedTeamForMatchDay(md.id, player.id)
                              const canEditSel = canEditGameSelection(team.id)
                              return (
                                <Fragment key={md.id}>
                                  <td className="border-l border-slate-100 px-2 py-1.5">
                                    {canEditAv ? (
                                      <select
                                        value={status ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value as AvailabilityStatus | ''
                                          if (v) setGameAvailability(game.id, player.id, v, isOverride(player.id, team.id))
                                          else if (status) clearGameAvailability(game.id, player.id)
                                        }}
                                        className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs"
                                      >
                                        <option value="">—</option>
                                        {(['available', 'maybe', 'unavailable'] as const).map((s) => (
                                          <option key={s} value={s}>
                                            {availabilityLabel[s]}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-xs text-slate-600">
                                        {status ? availabilityLabel[status] : '—'}
                                      </span>
                                    )}
                                  </td>
                                  <td key={`${md.id}-sel`} className="border-l border-slate-100 px-2 py-1.5">
                                    {canEditSel && myClubTeamsInPhase.length > 0 ? (
                                      <TeamSelect
                                        value={selectedTeamId}
                                        onChange={(v) =>
                                          setPlayerSelectedForMatchDay(md.id, player.id, v)
                                        }
                                        optionIds={orderedTeamOptionIds(team.id, player.id, md.id)}
                                        getLabel={getTeamLabel}
                                        getColor={getTeamColor}
                                      />
                                    ) : (
                                      <span className="text-xs text-slate-600">
                                        {selectedTeamId ? getTeamSelectLabel(selectedTeamId) : '—'}
                                      </span>
                                    )}
                                  </td>
                                </Fragment>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-700">
                        <td colSpan={6} className="px-3 py-2">
                          Résumé
                        </td>
                        {visibleMatchDays.map((md) => {
                          const game = games.find(
                            (g) =>
                              g.matchDayId === md.id &&
                              (g.homeTeamId === team.id || g.awayTeamId === team.id)
                          )
                          const required =
                            divisions.find((d) => d.id === team.divisionId)?.playersPerGame ?? 4
                          if (!game) {
                            return (
                              <Fragment key={md.id}>
                                <td className="border-l border-slate-200 px-2 py-2 text-center">—</td>
                                <td className="border-l border-slate-200 px-2 py-2 text-center">—</td>
                              </Fragment>
                            )
                          }
                          const availableCount = roster.filter(
                            (p) => getAvailability(game.id, p.id) === 'available'
                          ).length
                          const selectedCount = getGameSelectionPlayerIds(game.id, team.id).length
                          const availOk = availableCount >= required
                          const compoOk = selectedCount === required
                          return (
                            <Fragment key={md.id}>
                              <td
                                className={`border-l border-slate-200 px-2 py-2 text-center font-medium ${
                                  availOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {availableCount}/{required}
                              </td>
                              <td
                                className={`border-l border-slate-200 px-2 py-2 text-center font-medium ${
                                  compoOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {selectedCount}/{required}
                              </td>
                            </Fragment>
                          )
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </section>
        )
      })}

      {/* Other players (club, not in any team roster) */}
      {otherPlayers.length > 0 && otherGroupMatchDays.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="font-display text-lg font-medium text-slate-800">
              Autres joueurs du club
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Joueurs non rattachés à une équipe ; uniquement la composition (équipe retenue) par match.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-4 py-2">
            {otherGroupMatchDays.length > 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setOtherMatchDayOffset((o) => Math.max(0, o - 1))}
                  disabled={otherMatchDayOffset <= 0}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Journées précédentes"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-slate-500">
                  {otherMatchDayOffset + 1}–{Math.min(otherMatchDayOffset + 2, otherGroupMatchDays.length)} / {otherGroupMatchDays.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setOtherMatchDayOffset((o) =>
                      Math.min(Math.max(0, otherGroupMatchDays.length - 2), o + 1)
                    )
                  }
                  disabled={otherMatchDayOffset >= Math.max(0, otherGroupMatchDays.length - 2)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Journées suivantes"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="overflow-x-auto">
            {(() => {
              const otherVisibleMatchDays = otherGroupMatchDays.slice(
                otherMatchDayOffset,
                otherMatchDayOffset + 2
              )
              const otherMinWidth =
                TABLE_COL_WIDTHS.joueur +
                TABLE_COL_WIDTHS.licence +
                TABLE_COL_WIDTHS.points +
                TABLE_COL_WIDTHS.dispo +
                TABLE_COL_WIDTHS.joues +
                otherVisibleMatchDays.length *
                  (TABLE_COL_WIDTHS.matchDayDispo + TABLE_COL_WIDTHS.matchDayCompo)
              return (
            <table
              className="w-full border-collapse text-sm table-fixed"
              style={{ minWidth: otherMinWidth }}
            >
              <MatchDayColgroup matchDayCount={otherVisibleMatchDays.length} />
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-700">
                    Joueur
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-700">
                    Licence
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-700">
                    Points
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-center font-medium text-slate-700">
                    Dispo
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-center font-medium text-slate-700">
                    Joués
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-center font-medium text-slate-700">
                    Brûlage
                  </th>
                  {otherVisibleMatchDays.map((md) => (
                      <th
                        key={md.id}
                        colSpan={2}
                        className="whitespace-nowrap border-l border-slate-200 px-2 py-2 text-center font-medium text-slate-700"
                      >
                        J{md.number}
                        <span className="block text-xs font-normal text-slate-500">
                          {new Date(md.date + 'Z').toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </th>
                    ))}
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-600">
                  <th colSpan={6} className="px-3 py-1"></th>
                  {otherVisibleMatchDays.map((md) => (
                    <Fragment key={md.id}>
                      <th className="border-l border-slate-200 px-1 py-1 text-center font-normal">
                        Dispo
                      </th>
                      <th className="border-l border-slate-200 px-1 py-1 text-center font-normal">
                        Compo
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {otherPlayers.map((player) => (
                  <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                      {player.firstName} {player.lastName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {player.licenseNumber || '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {player.points ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center text-slate-400">—</td>
                    <td className="whitespace-nowrap px-3 py-2 text-center text-slate-400">—</td>
                    <td className="whitespace-nowrap px-3 py-2 text-center text-slate-600 text-xs">
                      {(() => {
                        const b = computeBrulage(player.id, myClubTeamsInPhase, matchDays, games, gameSelections)
                        if (!b.burnedIntoTeamId) return '—'
                        const bTeam = teams.find((t) => t.id === b.burnedIntoTeamId)
                        const bColor = getTeamColor(b.burnedIntoTeamId)
                        return bTeam ? (
                          <span className="inline-flex items-center gap-1">
                            {bColor && (
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: bColor }}
                                aria-hidden
                              />
                            )}
                            Equipe {bTeam.number}
                          </span>
                        ) : '—'
                      })()}
                    </td>
                    {otherVisibleMatchDays.map((md) => {
                        const dayGames = games.filter((g) => g.matchDayId === md.id)
                        const ourClubTeamsThisDay = [
                          ...new Set(
                            dayGames.flatMap((g) =>
                              [g.homeTeamId, g.awayTeamId].filter((tid) =>
                                user?.clubIds?.includes(
                                  teams.find((t) => t.id === tid)?.clubId ?? ''
                                )
                              )
                            )
                          ),
                        ]
                        const selectedTeamId = getSelectedTeamForMatchDay(md.id, player.id)
                        const canEditSel = ourClubTeamsThisDay.some((tid) =>
                          canEditGameSelection(tid)
                        )
                        return (
                          <Fragment key={md.id}>
                            <td className="border-l border-slate-100 px-2 py-1.5 text-center text-slate-400">
                              —
                            </td>
                            <td className="border-l border-slate-100 px-2 py-1.5">
                              {canEditSel && myClubTeamsInPhase.length > 0 ? (
                                <TeamSelect
                                  value={selectedTeamId}
                                  onChange={(v) =>
                                    setPlayerSelectedForMatchDay(md.id, player.id, v)
                                  }
                                  optionIds={orderedTeamOptionIds(null, player.id, md.id)}
                                  getLabel={getTeamLabel}
                                  getColor={getTeamColor}
                                />
                              ) : (
                                <span className="text-xs text-slate-600">
                                  {selectedTeamId ? getTeamSelectLabel(selectedTeamId) : '—'}
                                </span>
                              )}
                            </td>
                          </Fragment>
                        )
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
              );
            })()}
          </div>
        </section>
      )}

      {/* Create / Edit match-day modal */}
      {(editingMatchDay || creatingMatchDay) && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="matchday-modal-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="matchday-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {creatingMatchDay ? 'Ajouter une journée' : 'Modifier la journée'}
            </h2>
            <div className="mt-4 space-y-4">
              {creatingMatchDay && (
                <div>
                  <label htmlFor="md-group" className="block text-sm font-medium text-slate-700">
                    Groupe
                  </label>
                  <select
                    id="md-group"
                    value={matchDayForm.groupId}
                    onChange={(e) =>
                      setMatchDayForm((f) => ({ ...f, groupId: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">—</option>
                    {groupOptionsInPhase.map((g) => (
                      <option key={g.id} value={g.id}>
                        {getGroupLabel(g.id)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!creatingMatchDay && editingMatchDay && (
                <div>
                  <span className="block text-sm font-medium text-slate-700">Groupe</span>
                  <p className="mt-1 text-sm text-slate-900">
                    {getGroupLabel(editingMatchDay.groupId)}
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="md-number" className="block text-sm font-medium text-slate-700">
                  Numéro de journée
                </label>
                <input
                  id="md-number"
                  type="number"
                  min={1}
                  value={matchDayForm.number}
                  onChange={(e) =>
                    setMatchDayForm((f) => ({ ...f, number: Number(e.target.value) || 1 }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="md-date" className="block text-sm font-medium text-slate-700">
                  Date
                </label>
                <input
                  id="md-date"
                  type="date"
                  value={matchDayForm.date}
                  onChange={(e) => setMatchDayForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeMatchDayModal}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveMatchDay}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game edit modal — opened by clicking J1, J2, … in a team table */}
      {gameEditModal && gameEditModalTeam && gameEditModalMatchDay && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-edit-modal-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="game-edit-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {games.some(
                (g) =>
                  g.matchDayId === gameEditModal.matchDayId &&
                  (g.homeTeamId === gameEditModal.teamId || g.awayTeamId === gameEditModal.teamId)
              )
                ? 'Modifier le match'
                : 'Créer le match'
              }
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {getTeamLabel(gameEditModal.teamId)} — J{gameEditModalMatchDay.number}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="game-edit-date" className="block text-sm font-medium text-slate-700">
                  Date
                </label>
                <input
                  id="game-edit-date"
                  type="date"
                  value={gameEditForm.date}
                  onChange={(e) =>
                    setGameEditForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="game-edit-time" className="block text-sm font-medium text-slate-700">
                  Heure
                </label>
                <input
                  id="game-edit-time"
                  type="text"
                  placeholder="20h00"
                  value={gameEditForm.time}
                  onChange={(e) =>
                    setGameEditForm((f) => ({ ...f, time: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Domicile / Extérieur</span>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={gameEditForm.isHome}
                    onChange={(e) =>
                      setGameEditForm((f) => ({ ...f, isHome: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    {gameEditForm.isHome ? 'Domicile' : 'Extérieur'}
                  </span>
                </label>
              </div>
              <div>
                <label htmlFor="game-edit-opponent" className="block text-sm font-medium text-slate-700">
                  Adversaire
                </label>
                <select
                  id="game-edit-opponent"
                  value={gameEditForm.opponentTeamId}
                  onChange={(e) =>
                    setGameEditForm((f) => ({ ...f, opponentTeamId: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">—</option>
                  {gameEditOpponentOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {getTeamLabel(t.id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeGameEditModal}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveGameEdit}
                disabled={!gameEditForm.opponentTeamId}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
