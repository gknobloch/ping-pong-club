import { useState } from 'react'
import type { Group } from '@/types'
import { useMockData } from '@/contexts/MockDataContext'

export function GroupsPage() {
  const { groups, divisions, phases, teams, clubs, updateGroup, addGroup } = useMockData()
  const [editing, setEditing] = useState<Group | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ divisionId: '', number: 1 })

  const getDivisionName = (divisionId: string) =>
    divisions.find((d) => d.id === divisionId)?.displayName ?? divisionId
  const getPhaseName = (phaseId: string) =>
    phases.find((p) => p.id === phaseId)?.displayName ?? phaseId
  const getPhaseIdForDivision = (divisionId: string) =>
    divisions.find((d) => d.id === divisionId)?.phaseId
  const getTeamLabel = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return teamId
    const club = clubs.find((c) => c.id === team.clubId)
    return `${club?.displayName ?? team.clubId} ${team.number}`
  }

  const openEdit = (group: Group) => {
    setEditing(group)
    setCreating(false)
    setForm({ divisionId: group.divisionId, number: group.number })
  }

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({
      divisionId: divisions[0]?.id ?? '',
      number: groups.filter((g) => g.divisionId === divisions[0]?.id).length + 1,
    })
  }

  const closeModal = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleSave = () => {
    if (editing) {
      updateGroup(editing.id, { divisionId: form.divisionId, number: form.number })
      closeModal()
    } else if (creating && form.divisionId) {
      addGroup({
        divisionId: form.divisionId,
        number: form.number,
        teamIds: [],
      })
      closeModal()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Groupes</h1>
          <p className="mt-1 text-slate-600 text-sm">
            Chaque division contient un ou plusieurs groupes ; les équipes sont réparties dans ces
            groupes pour les matchs.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shrink-0"
        >
          Ajouter un groupe
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Division
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Phase
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                N° groupe
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Équipes
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {getDivisionName(group.divisionId)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {getPhaseName(getPhaseIdForDivision(group.divisionId) ?? '')}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{group.number}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {group.teamIds.map(getTeamLabel).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
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
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="group-modal-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="group-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {creating ? 'Ajouter un groupe' : 'Modifier le groupe'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="group-divisionId" className="block text-sm font-medium text-slate-700">
                  Division
                </label>
                <select
                  id="group-divisionId"
                  value={form.divisionId}
                  onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>{d.displayName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="group-number" className="block text-sm font-medium text-slate-700">
                  N° groupe
                </label>
                <input
                  id="group-number"
                  type="number"
                  min={1}
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: Number(e.target.value) || 1 }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
