import { useState, useMemo } from 'react'
import type { MatchDay, Game } from '@/types'
import { useMockData } from '@/contexts/MockDataContext'

export function MatchDaysPage() {
  const {
    phases,
    divisions,
    groups,
    matchDays,
    games,
    teams,
    clubs,
    addMatchDay,
    updateMatchDay,
    addGame,
    updateGame,
  } = useMockData()
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(phases[0]?.id ?? '')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  const phaseGroups = useMemo(() => {
    return groups.filter((g) => {
      const div = divisions.find((d) => d.id === g.divisionId)
      return div?.phaseId === selectedPhaseId
    })
  }, [groups, divisions, selectedPhaseId])

  const effectiveGroupId = selectedGroupId || phaseGroups[0]?.id || ''
  const groupMatchDays = matchDays
    .filter((m) => m.groupId === effectiveGroupId)
    .sort((a, b) => a.number - b.number)
  const hasMatchDays = groupMatchDays.length > 0

  const [editingMatchDay, setEditingMatchDay] = useState<MatchDay | null>(null)
  const [creatingMatchDay, setCreatingMatchDay] = useState(false)
  const [matchDayForm, setMatchDayForm] = useState({ groupId: '', number: 1, date: '' })

  const [addingGameForMatchDayId, setAddingGameForMatchDayId] = useState<string | null>(null)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [gameForm, setGameForm] = useState({ homeTeamId: '', awayTeamId: '' })

  const getTeamLabel = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return teamId
    const club = clubs.find((c) => c.id === team.clubId)
    return `${club?.displayName ?? team.clubId} ${team.number}`
  }

  const getGroupLabel = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId)
    if (!g) return groupId
    const div = divisions.find((d) => d.id === g.divisionId)
    return div ? `${div.displayName} – Groupe ${g.number}` : `Groupe ${g.number}`
  }

  const nextMatchDayNumber = () => {
    if (!effectiveGroupId) return 1
    const inGroup = matchDays.filter((m) => m.groupId === effectiveGroupId)
    if (inGroup.length === 0) return 1
    return Math.max(...inGroup.map((m) => m.number)) + 1
  }

  const openCreateMatchDay = () => {
    setCreatingMatchDay(true)
    setEditingMatchDay(null)
    const today = new Date().toISOString().slice(0, 10)
    setMatchDayForm({
      groupId: effectiveGroupId,
      number: nextMatchDayNumber(),
      date: today,
    })
  }

  const openEditMatchDay = (md: MatchDay) => {
    setEditingMatchDay(md)
    setCreatingMatchDay(false)
    setMatchDayForm({
      groupId: md.groupId,
      number: md.number,
      date: md.date,
    })
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

  const openAddGame = (matchDayId: string) => {
    setAddingGameForMatchDayId(matchDayId)
    setEditingGame(null)
    setGameForm({ homeTeamId: '', awayTeamId: '' })
  }

  const openEditGame = (game: Game) => {
    setEditingGame(game)
    setAddingGameForMatchDayId(null)
    setGameForm({ homeTeamId: game.homeTeamId, awayTeamId: game.awayTeamId })
  }

  const closeGameModal = () => {
    setAddingGameForMatchDayId(null)
    setEditingGame(null)
  }

  const handleSaveGame = () => {
    if (addingGameForMatchDayId && gameForm.homeTeamId && gameForm.awayTeamId) {
      addGame({
        matchDayId: addingGameForMatchDayId,
        homeTeamId: gameForm.homeTeamId,
        awayTeamId: gameForm.awayTeamId,
      })
      closeGameModal()
    } else if (editingGame) {
      updateGame(editingGame.id, {
        homeTeamId: gameForm.homeTeamId,
        awayTeamId: gameForm.awayTeamId,
      })
      closeGameModal()
    }
  }

  const gameModalMatchDayId = addingGameForMatchDayId ?? editingGame?.matchDayId ?? null
  const gameModalMatchDay = gameModalMatchDayId
    ? matchDays.find((m) => m.id === gameModalMatchDayId)
    : null
  const gameModalGroup = gameModalMatchDay
    ? groups.find((g) => g.id === gameModalMatchDay.groupId)
    : null
  const gameModalTeams = useMemo(() => {
    if (!gameModalGroup) return []
    return teams.filter((t) => gameModalGroup.teamIds.includes(t.id))
  }, [teams, gameModalGroup])

  const gameModalUsedTeamIds = useMemo(() => {
    if (!gameModalMatchDayId) return new Set<string>()
    const dayGames = games.filter((g) => g.matchDayId === gameModalMatchDayId)
    const toExclude =
      editingGame && dayGames.some((g) => g.id === editingGame.id)
        ? dayGames.filter((g) => g.id !== editingGame.id)
        : dayGames
    return new Set(toExclude.flatMap((g) => [g.homeTeamId, g.awayTeamId]))
  }, [games, gameModalMatchDayId, editingGame?.id])

  const gameModalAvailableTeams = useMemo(
    () => gameModalTeams.filter((t) => !gameModalUsedTeamIds.has(t.id)),
    [gameModalTeams, gameModalUsedTeamIds]
  )

  const homeTeamOptions = useMemo(
    () => gameModalAvailableTeams.filter((t) => t.id !== gameForm.awayTeamId),
    [gameModalAvailableTeams, gameForm.awayTeamId]
  )
  const awayTeamOptions = useMemo(
    () => gameModalAvailableTeams.filter((t) => t.id !== gameForm.homeTeamId),
    [gameModalAvailableTeams, gameForm.homeTeamId]
  )

  const handlePhaseChange = (phaseId: string) => {
    setSelectedPhaseId(phaseId)
    const nextGroups = groups.filter((g) => {
      const div = divisions.find((d) => d.id === g.divisionId)
      return div?.phaseId === phaseId
    })
    setSelectedGroupId(nextGroups[0]?.id ?? '')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">
            Journées et matchs
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Définir les journées et les matchs par groupe.
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
          {phaseGroups.length > 0 && (
            <select
              value={effectiveGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {phaseGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {getGroupLabel(g.id)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={openCreateMatchDay}
            disabled={!effectiveGroupId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Ajouter une journée
          </button>
        </div>
      </div>

      {selectedPhaseId && phaseGroups.length === 0 && (
        <p className="text-sm text-slate-600">Aucun groupe dans cette phase.</p>
      )}

      {selectedPhaseId && phaseGroups.length > 0 && !effectiveGroupId && (
        <p className="text-sm text-slate-600">Sélectionnez un groupe.</p>
      )}

      {effectiveGroupId && !hasMatchDays && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-slate-600">
            Aucune journée pour ce groupe. Cliquez sur « Ajouter une journée » pour en créer une.
          </p>
        </div>
      )}

      {effectiveGroupId && hasMatchDays && (
        <div className="space-y-6">
          {groupMatchDays.map((md) => {
            const dayGames = games.filter((g) => g.matchDayId === md.id)
            return (
              <section
                key={md.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h2 className="font-display text-lg font-medium text-slate-800">
                    Journée {md.number}
                    <span className="ml-2 text-sm font-normal text-slate-600">
                      {new Date(md.date + 'Z').toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditMatchDay(md)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => openAddGame(md.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ajouter un match
                    </button>
                  </div>
                </div>
                <ul className="divide-y divide-slate-200">
                  {dayGames.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-slate-500">Aucun match</li>
                  ) : (
                    dayGames.map((game) => (
                      <li
                        key={game.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50"
                      >
                        <span className="text-sm font-medium text-slate-900">
                          {getTeamLabel(game.homeTeamId)}
                        </span>
                        <span className="text-sm text-slate-400">—</span>
                        <span className="text-sm font-medium text-slate-900">
                          {getTeamLabel(game.awayTeamId)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditGame(game)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Modifier
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            )
          })}
        </div>
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
              {creatingMatchDay && effectiveGroupId && (
                <div>
                  <span className="block text-sm font-medium text-slate-700">Groupe</span>
                  <p className="mt-1 text-sm text-slate-900">{getGroupLabel(effectiveGroupId)}</p>
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

      {/* Add / Edit game modal — teams restricted to the match-day's group */}
      {(addingGameForMatchDayId || editingGame) && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-modal-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="game-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {editingGame ? 'Modifier le match' : 'Ajouter un match'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="game-home" className="block text-sm font-medium text-slate-700">
                  Équipe à domicile
                </label>
                <select
                  id="game-home"
                  value={gameForm.homeTeamId}
                  onChange={(e) => setGameForm((f) => ({ ...f, homeTeamId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">—</option>
                  {homeTeamOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {getTeamLabel(t.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="game-away" className="block text-sm font-medium text-slate-700">
                  Équipe extérieur
                </label>
                <select
                  id="game-away"
                  value={gameForm.awayTeamId}
                  onChange={(e) => setGameForm((f) => ({ ...f, awayTeamId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">—</option>
                  {awayTeamOptions.map((t) => (
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
                onClick={closeGameModal}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveGame}
                disabled={
                  !gameForm.homeTeamId ||
                  !gameForm.awayTeamId ||
                  gameForm.homeTeamId === gameForm.awayTeamId
                }
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
