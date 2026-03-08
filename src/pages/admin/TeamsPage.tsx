import { useMemo, useState } from 'react'
import type { Team } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useMockData } from '@/contexts/MockDataContext'

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
  } = useMockData()

  const teams = useMemo(() => {
    if (user?.role === 'club_admin' && user.clubIds?.length) {
      return allTeams.filter((t) => user.clubIds.includes(t.clubId))
    }
    return allTeams
  }, [allTeams, user?.role, user?.clubIds])

  const clubsForSelect =
    user?.role === 'club_admin' && user?.clubIds?.length
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
  })

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
    ? players.filter((p) => p.clubId === form.clubId && p.status === 'active')
    : []

  const openEdit = (team: Team) => {
    setEditing(team)
    setCreating(false)
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
    const firstCaptain = firstClub ? players.find((p) => p.clubId === firstClub.id) : undefined
    setForm({
      clubId: firstClub?.id ?? '',
      phaseId: firstPhase?.id ?? '',
      number: 1,
      divisionId: firstDiv?.id ?? '',
      groupId: firstGroup?.id ?? '',
      gameLocationId: defaultAddr?.id ?? '',
      defaultDay: 'Jeudi',
      defaultTime: '20h00',
      captainId: firstCaptain?.id ?? '',
    })
  }

  const closeModal = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleSave = () => {
    if (editing) {
      updateTeam(editing.id, {
        number: form.number,
        gameLocationId: form.gameLocationId,
        defaultDay: form.defaultDay,
        defaultTime: form.defaultTime,
        captainId: form.captainId,
      })
      closeModal()
      return
    }
    if (!creating || !form.clubId || !form.phaseId || !form.divisionId || !form.groupId || !form.gameLocationId || !form.captainId) return
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
    })
    const group = groups.find((g) => g.id === form.groupId)
    if (group) {
      updateGroup(group.id, { teamIds: [...group.teamIds, newTeam.id] })
    }
    closeModal()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Équipes</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ajouter une équipe
        </button>
      </div>
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
              <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{getClubName(team.clubId)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{team.number}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{getPhaseName(team.phaseId)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{getDivisionName(team.divisionId)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {team.defaultDay} {team.defaultTime}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{getCaptainName(team.captainId)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(team)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Modifier
                  </button>
                </td>
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
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg my-8">
            <h2 id="team-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {creating ? 'Ajouter une équipe' : 'Modifier l\'équipe'}
            </h2>
            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="team-clubId" className="block text-sm font-medium text-slate-700">
                    Club
                  </label>
                  <select
                    id="team-clubId"
                    value={form.clubId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        clubId: e.target.value,
                        gameLocationId: '',
                        captainId: '',
                      }))
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
                  <label htmlFor="team-number" className="block text-sm font-medium text-slate-700">
                    N° équipe
                  </label>
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
              {creating && (
                <>
                  <div>
                    <label htmlFor="team-phaseId" className="block text-sm font-medium text-slate-700">
                      Phase
                    </label>
                    <select
                      id="team-phaseId"
                      value={form.phaseId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          phaseId: e.target.value,
                          divisionId: '',
                          groupId: '',
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {phases.map((p) => (
                        <option key={p.id} value={p.id}>{p.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="team-divisionId" className="block text-sm font-medium text-slate-700">
                      Division
                    </label>
                    <select
                      id="team-divisionId"
                      value={form.divisionId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, divisionId: e.target.value, groupId: '' }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {divisionsInPhase.map((d) => (
                        <option key={d.id} value={d.id}>{d.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="team-groupId" className="block text-sm font-medium text-slate-700">
                      Groupe
                    </label>
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
                </>
              )}
              <div>
                <label htmlFor="team-gameLocationId" className="block text-sm font-medium text-slate-700">
                  Lieu de jeu
                </label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="team-defaultDay" className="block text-sm font-medium text-slate-700">
                    Jour
                  </label>
                  <input
                    id="team-defaultDay"
                    type="text"
                    value={form.defaultDay}
                    onChange={(e) => setForm((f) => ({ ...f, defaultDay: e.target.value }))}
                    placeholder="Jeudi"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="team-defaultTime" className="block text-sm font-medium text-slate-700">
                    Heure
                  </label>
                  <input
                    id="team-defaultTime"
                    type="text"
                    value={form.defaultTime}
                    onChange={(e) => setForm((f) => ({ ...f, defaultTime: e.target.value }))}
                    placeholder="20h00"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="team-captainId" className="block text-sm font-medium text-slate-700">
                  Capitaine
                </label>
                <select
                  id="team-captainId"
                  value={form.captainId}
                  onChange={(e) => setForm((f) => ({ ...f, captainId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {playersInClub.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
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
                    !form.captainId)
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
