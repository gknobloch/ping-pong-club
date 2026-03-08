import { useState } from 'react'
import type { Phase } from '@/types'
import { useMockData } from '@/contexts/MockDataContext'

export function PhasesPage() {
  const { phases, seasons, updatePhase, addPhase } = useMockData()
  const [editing, setEditing] = useState<Phase | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    seasonId: '',
    name: '',
    displayName: '',
    isActive: false,
    isArchived: false,
  })

  const getSeasonName = (seasonId: string) =>
    seasons.find((s) => s.id === seasonId)?.displayName ?? seasonId

  const openEdit = (phase: Phase) => {
    setEditing(phase)
    setCreating(false)
    setForm({
      seasonId: phase.seasonId,
      name: phase.name,
      displayName: phase.displayName,
      isActive: phase.isActive,
      isArchived: phase.isArchived,
    })
  }

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    const firstSeasonId = seasons[0]?.id ?? ''
    setForm({
      seasonId: firstSeasonId,
      name: 'Phase 1',
      displayName: firstSeasonId ? `${getSeasonName(firstSeasonId)} Phase 1` : '',
      isActive: false,
      isArchived: false,
    })
  }

  const closeModal = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleSeasonChange = (seasonId: string) => {
    const seasonName = getSeasonName(seasonId)
    setForm((f) => ({
      ...f,
      seasonId,
      displayName: seasonName ? `${seasonName} ${f.name}` : f.displayName,
    }))
  }

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      displayName: f.seasonId ? `${getSeasonName(f.seasonId)} ${name}` : name,
    }))
  }

  const handleSave = () => {
    if (editing) {
      updatePhase(editing.id, {
        displayName: form.displayName,
        isActive: form.isActive,
        isArchived: form.isArchived,
      })
      closeModal()
    } else if (creating && form.seasonId && form.displayName) {
      addPhase({
        seasonId: form.seasonId,
        name: form.name,
        displayName: form.displayName,
        isActive: form.isActive,
        isArchived: form.isArchived,
      })
      closeModal()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Phases</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ajouter une phase
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Phase
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Saison
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Statut
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {phases.map((phase) => (
              <tr key={phase.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{phase.displayName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{getSeasonName(phase.seasonId)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      phase.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {phase.isActive ? 'Active' : phase.isArchived ? 'Archivée' : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(phase)}
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
          aria-labelledby="phase-modal-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="phase-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {creating ? 'Ajouter une phase' : 'Modifier la phase'}
            </h2>
            <div className="mt-4 space-y-4">
              {creating && (
                <>
                  <div>
                    <label htmlFor="phase-seasonId" className="block text-sm font-medium text-slate-700">
                      Saison
                    </label>
                    <select
                      id="phase-seasonId"
                      value={form.seasonId}
                      onChange={(e) => handleSeasonChange(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {seasons.map((s) => (
                        <option key={s.id} value={s.id}>{s.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phase-name" className="block text-sm font-medium text-slate-700">
                      Nom (ex. Phase 1)
                    </label>
                    <input
                      id="phase-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </>
              )}
              {!creating && (
                <div>
                  <label htmlFor="phase-displayName" className="block text-sm font-medium text-slate-700">
                    Nom affiché
                  </label>
                  <input
                    id="phase-displayName"
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}
              {creating && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nom affiché</label>
                  <p className="mt-1 text-sm text-slate-600">{form.displayName}</p>
                </div>
              )}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isArchived}
                    onChange={(e) => setForm((f) => ({ ...f, isArchived: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Archivée</span>
                </label>
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
