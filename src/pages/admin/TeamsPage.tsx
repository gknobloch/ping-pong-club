import { useMemo, useState } from 'react'
import type { Team } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'

export function TeamsPage() {
  const { user } = useAuth()
  const {
    teams: allTeams,
    clubs,
    phases,
    divisions,
    groups,
    players,
    updateTeam,
    addTeam,
    updateGroup,
    archiveTeam,
    deleteTeam,
  } = useAppData()

  const isClubAdmin = user?.role === 'club_admin'
  const isAdmin = user?.role === 'general_admin' || isClubAdmin
  const hasClubScope = (user?.role === 'club_admin' || user?.role === 'captain' || user?.role === 'player') && (user?.clubIds?.length ?? 0) > 0

  const [showArchived, setShowArchived] = useState(false)

  const allVisibleTeams = useMemo(() => {
    let t = allTeams
    if (hasClubScope && user?.clubIds?.length) {
      t = t.filter((team) => user.clubIds.includes(team.clubId))
    }
    return t
  }, [allTeams, hasClubScope, user?.clubIds])

  const activeTeams = useMemo(() => allVisibleTeams.filter((t) => !t.isArchived), [allVisibleTeams])
  const archivedTeams = useMemo(() => allVisibleTeams.filter((t) => t.isArchived), [allVisibleTeams])
  const teams = showArchived ? allVisibleTeams : activeTeams

  const clubsForSelect =
    hasClubScope && user?.clubIds?.length
      ? clubs.filter((c) => user.clubIds.includes(c.id))
      : clubs
  const [editing, setEditing] = useState<Team | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    clubId: '',
    phaseId: '',
    number: 1,
    divisionId: '',
    groupId: '',
    gameLocationId: '',
    defaultDay: '',
    defaultTime: '',
    captainId: '',
    playerIds: [] as string[],
    /** Initial points per player for this phase (when in this team). */
    initialPoints: {} as Record<string, string>,
    whatsappLink: '',
  })

  const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 9) // 9..21
  const MINUTES = ['00', '15', '30', '45']

  /** Parse "16h30" → { hour: 16, minute: '30' } */
  const parseTime = (t: string) => {
    const m = t.match(/^(\d{1,2})h(\d{2})$/)
    return m ? { hour: Number(m[1]), minute: m[2] } : null
  }
  const parsedTime = parseTime(form.defaultTime)
  const timeHour = parsedTime?.hour ?? ''
  const timeMinute = parsedTime?.minute ?? '00'

  const setTimeFromParts = (hour: string, minute: string) => {
    if (!hour) {
      setForm((f) => ({ ...f, defaultTime: '' }))
    } else {
      setForm((f) => ({ ...f, defaultTime: `${hour}h${minute}` }))
    }
  }

  const getClubName = (clubId: string) => clubs.find((c) => c.id === clubId)?.displayName ?? clubId
  const getPhaseName = (phaseId: string) => phases.find((p) => p.id === phaseId)?.displayName ?? phaseId
  const getDivisionName = (divisionId: string) =>
    divisions.find((d) => d.id === divisionId)?.displayName ?? divisionId
  const getCaptainName = (captainId: string) => {
    const p = players.find((x) => x.id === captainId)
    return p ? `${p.firstName} ${p.lastName}` : captainId
  }

  const divisionsInPhase = form.phaseId
    ? divisions.filter((d) => d.phaseId === form.phaseId)
    : []
  const groupsInDivision = form.divisionId
    ? groups.filter((g) => g.divisionId === form.divisionId)
    : []
  const selectedClub = form.clubId ? clubs.find((c) => c.id === form.clubId) : undefined
  const addressesForClub = selectedClub?.addresses ?? []
  const playersInClub = form.clubId
    ? players.filter(
        (p) => p.clubId === form.clubId && p.status === 'active' && p.clubId !== ''
      )
    : []

  /** Player IDs already assigned to another team in the same phase (excluding current team). */
  const playerIdsInOtherTeams = useMemo(() => {
    if (!form.phaseId) return new Set<string>()
    const editingId = editing?.id
    return new Set(
      allTeams
        .filter((t) => t.phaseId === form.phaseId && !t.isArchived && t.id !== editingId)
        .flatMap((t) => t.playerIds ?? [])
    )
  }, [allTeams, form.phaseId, editing?.id])

  /** Players available to add: in club, not already in this team, not in another team in the same phase. */
  const availablePlayersToAdd = playersInClub.filter(
    (p) => !form.playerIds.includes(p.id) && !playerIdsInOtherTeams.has(p.id)
  )

  const openEdit = (team: Team) => {
    setEditing(team)
    setCreating(false)
    const rosterIds = team.playerIds ?? []
    const initialPoints: Record<string, string> = {}
    rosterIds.forEach((pid) => {
      initialPoints[pid] = team.rosterInitialPoints?.[pid] ?? players.find((p) => p.id === pid)?.points ?? ''
    })
    setForm({
      clubId: team.clubId,
      phaseId: team.phaseId,
      number: team.number,
      divisionId: team.divisionId,
      groupId: team.groupId,
      gameLocationId: team.gameLocationId,
      defaultDay: team.defaultDay,
      defaultTime: team.defaultTime,
      captainId: team.captainId,
      playerIds: rosterIds,
      initialPoints,
      whatsappLink: team.whatsappLink ?? '',
    })
  }

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    const firstClub = clubsForSelect[0]
    const firstPhase = phases[0]
    const firstDiv = divisions.find((d) => d.phaseId === firstPhase?.id)
    const firstGroup = firstDiv ? groups.find((g) => g.divisionId === firstDiv.id) : undefined
    const defaultAddr = firstClub?.addresses?.find((a) => a.isDefault) ?? firstClub?.addresses?.[0]
    setForm({
      clubId: firstClub?.id ?? '',
      phaseId: firstPhase?.id ?? '',
      number: 1,
      divisionId: firstDiv?.id ?? '',
      groupId: firstGroup?.id ?? '',
      gameLocationId: defaultAddr?.id ?? '',
      defaultDay: 'Jeudi',
      defaultTime: '20h00',
      captainId: '',
      playerIds: [],
      initialPoints: {},
      whatsappLink: '',
    })
  }

  const closeModal = () => {
    setEditing(null)
    setCreating(false)
  }

  const rosterPlayers = form.playerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as typeof playersInClub
  const captainForSave =
    form.playerIds.length === 0
      ? ''
      : form.playerIds.includes(form.captainId)
        ? form.captainId
        : form.playerIds[0] ?? ''

  const buildRosterInitialPoints = (): Record<string, string> | undefined => {
    const out: Record<string, string> = {}
    form.playerIds.forEach((pid) => {
      out[pid] = (form.initialPoints[pid] ?? '').trim()
    })
    return form.playerIds.length > 0 ? out : undefined
  }

  const handleSave = () => {
    if (editing) {
      updateTeam(editing.id, {
        number: form.number,
        gameLocationId: form.gameLocationId,
        defaultDay: form.defaultDay,
        defaultTime: form.defaultTime,
        playerIds: form.playerIds,
        captainId: captainForSave,
        rosterInitialPoints: buildRosterInitialPoints(),
        whatsappLink: form.whatsappLink || undefined,
      })
      closeModal()
      return
    }
    if (
      !creating ||
      !form.clubId ||
      !form.phaseId ||
      !form.divisionId ||
      !form.groupId ||
      !form.gameLocationId ||
      form.playerIds.length === 0 ||
      !form.playerIds.includes(form.captainId)
    )
      return
    const newTeam = addTeam({
      clubId: form.clubId,
      phaseId: form.phaseId,
      number: form.number,
      divisionId: form.divisionId,
      groupId: form.groupId,
      gameLocationId: form.gameLocationId,
      defaultDay: form.defaultDay,
      defaultTime: form.defaultTime,
      captainId: form.captainId,
      playerIds: form.playerIds,
      rosterInitialPoints: buildRosterInitialPoints(),
      whatsappLink: form.whatsappLink || undefined,
      isArchived: false,
    })
    const group = groups.find((g) => g.id === form.groupId)
    if (group) {
      updateGroup(group.id, { teamIds: [...group.teamIds, newTeam.id] })
    }
    closeModal()
  }

  const handleArchive = (team: Team) => {
    if (window.confirm(`Archiver l'équipe "${getClubName(team.clubId)} ${team.number}" ? Elle ne sera plus visible dans la liste active.`)) {
      archiveTeam(team.id)
    }
  }

  const handleDelete = (team: Team) => {
    if (window.confirm(`Supprimer définitivement l'équipe "${getClubName(team.clubId)} ${team.number}" ? Les matchs, disponibilités et compositions associés seront également supprimés. Cette action est irréversible.`)) {
      deleteTeam(team.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Équipes</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ajouter une équipe
          </button>
        )}
      </div>
      {archivedTeams.length > 0 && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-600">
            Afficher les équipes archivées ({archivedTeams.length})
          </span>
        </label>
      )}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Club
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                N° équipe
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Phase
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Division
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Jour / heure
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Capitaine
              </th>
              {isAdmin && (
                <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {teams.map((team) => (
              <tr key={team.id} className={`hover:bg-slate-50/50 ${team.isArchived ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {getClubName(team.clubId)}
                  {team.isArchived && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                      Archivé
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{team.number}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{getPhaseName(team.phaseId)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{getDivisionName(team.divisionId)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {team.defaultDay} {team.defaultTime}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{getCaptainName(team.captainId)}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right space-x-3">
                    {!team.isArchived && (
                      <button
                        type="button"
                        onClick={() => openEdit(team)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Modifier
                      </button>
                    )}
                    {!team.isArchived && (
                      <button
                        type="button"
                        onClick={() => handleArchive(team)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Archiver
                      </button>
                    )}
                    {team.isArchived && (
                      <button
                        type="button"
                        onClick={() => handleDelete(team)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-modal-title"
        >
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg my-8">
            <h2 id="team-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {creating ? 'Ajouter une équipe' : 'Modifier l\'équipe'}
            </h2>
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Row 1: Club + N° */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label htmlFor="team-clubId" className="block text-sm font-medium text-slate-700">Club</label>
                  <select
                    id="team-clubId"
                    value={form.clubId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clubId: e.target.value, gameLocationId: '', captainId: '', playerIds: [] }))
                    }
                    disabled={!!editing}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                  >
                    {clubsForSelect.map((c) => (
                      <option key={c.id} value={c.id}>{c.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="team-number" className="block text-sm font-medium text-slate-700">N° équipe</label>
                  <input
                    id="team-number"
                    type="number"
                    min={1}
                    value={form.number}
                    onChange={(e) => setForm((f) => ({ ...f, number: Number(e.target.value) || 1 }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Create-only: Phase, Division, Group */}
              {creating && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="team-phaseId" className="block text-sm font-medium text-slate-700">Phase</label>
                    <select
                      id="team-phaseId"
                      value={form.phaseId}
                      onChange={(e) => setForm((f) => ({ ...f, phaseId: e.target.value, divisionId: '', groupId: '' }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {phases.map((p) => (
                        <option key={p.id} value={p.id}>{p.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="team-divisionId" className="block text-sm font-medium text-slate-700">Division</label>
                    <select
                      id="team-divisionId"
                      value={form.divisionId}
                      onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value, groupId: '' }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {divisionsInPhase.map((d) => (
                        <option key={d.id} value={d.id}>{d.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="team-groupId" className="block text-sm font-medium text-slate-700">Groupe</label>
                    <select
                      id="team-groupId"
                      value={form.groupId}
                      onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {groupsInDivision.map((g) => (
                        <option key={g.id} value={g.id}>Groupe {g.number}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Row 2: Lieu, Jour, Heure */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label htmlFor="team-gameLocationId" className="block text-sm font-medium text-slate-700">Lieu de jeu</label>
                  <select
                    id="team-gameLocationId"
                    value={form.gameLocationId}
                    onChange={(e) => setForm((f) => ({ ...f, gameLocationId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {addressesForClub.map((a) => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="team-defaultDay" className="block text-sm font-medium text-slate-700">Jour</label>
                  <select
                    id="team-defaultDay"
                    value={form.defaultDay}
                    onChange={(e) => setForm((f) => ({ ...f, defaultDay: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">—</option>
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Heure</label>
                  <div className="mt-1 flex items-center gap-1">
                    <select
                      value={timeHour}
                      onChange={(e) => setTimeFromParts(e.target.value, timeMinute)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">—</option>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-slate-500 font-medium">h</span>
                    <select
                      value={timeMinute}
                      onChange={(e) => setTimeFromParts(String(timeHour), e.target.value)}
                      disabled={!timeHour}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                    >
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* WhatsApp link */}
              <div>
                <label htmlFor="team-whatsapp" className="block text-sm font-medium text-slate-700">
                  Groupe WhatsApp
                </label>
                <input
                  id="team-whatsapp"
                  type="url"
                  value={form.whatsappLink}
                  onChange={(e) => setForm((f) => ({ ...f, whatsappLink: e.target.value }))}
                  placeholder="https://chat.whatsapp.com/..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Player table */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Joueurs de l&apos;équipe
                </label>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Joueur</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Licence</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Points (phase)</th>
                        <th className="px-3 py-2 text-center font-medium text-slate-700">Capitaine</th>
                        <th className="px-3 py-2 text-right font-medium text-slate-700"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rosterPlayers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                            Aucun joueur dans l&apos;équipe.
                          </td>
                        </tr>
                      ) : (
                        rosterPlayers.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {p.firstName} {p.lastName}
                            </td>
                            <td className="px-3 py-2 text-slate-500 text-xs">
                              {p.licenseNumber}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={form.initialPoints[p.id] ?? ''}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    initialPoints: { ...f.initialPoints, [p.id]: e.target.value },
                                  }))
                                }
                                placeholder="—"
                                className="w-20 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="radio"
                                name="captain"
                                checked={form.captainId === p.id}
                                onChange={() => setForm((f) => ({ ...f, captainId: p.id }))}
                                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((f) => {
                                    const next = { ...f.initialPoints }
                                    delete next[p.id]
                                    return {
                                      ...f,
                                      playerIds: f.playerIds.filter((id) => id !== p.id),
                                      captainId: f.captainId === p.id ? '' : f.captainId,
                                      initialPoints: next,
                                    }
                                  })
                                }}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                                title="Retirer de l'équipe"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {availablePlayersToAdd.length > 0 && (
                  <div className="mt-2">
                    <select
                      value=""
                      onChange={(e) => {
                        const id = e.target.value
                        if (id && !form.playerIds.includes(id)) {
                          const p = players.find((x) => x.id === id)
                          setForm((f) => ({
                            ...f,
                            playerIds: [...f.playerIds, id],
                            initialPoints: { ...f.initialPoints, [id]: p?.points ?? '' },
                          }))
                        }
                        e.target.value = ''
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">+ Ajouter un joueur</option>
                      {availablePlayersToAdd.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}{p.points ? ` (${p.points})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  creating &&
                  (!form.clubId ||
                    !form.phaseId ||
                    !form.divisionId ||
                    !form.groupId ||
                    !form.gameLocationId ||
                    form.playerIds.length === 0 ||
                    !form.playerIds.includes(form.captainId))
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
