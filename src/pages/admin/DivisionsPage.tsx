import { useState } from 'react'
import type { Division } from '@/types'
import { useAppData } from '@/contexts/DataContext'

export function DivisionsPage() {
  const { divisions, phases, updateDivision, addDivision, moveDivisionUp, moveDivisionDown } =
    useAppData()
  const [editing, setEditing] = useState<Division | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ phaseId: '', displayName: '', rank: 1, playersPerGame: 4 })

  const getPhaseName = (phaseId: string) =>
    phases.find((p) => p.id === phaseId)?.displayName ?? phaseId

  const divisionsByPhase = divisions
    .slice()
    .sort((a, b) => (a.phaseId !== b.phaseId ? a.phaseId.localeCompare(b.phaseId) : a.rank - b.rank))

  const getCanMoveUp = (div: Division) => {
    const inPhase = divisions.filter((d) => d.phaseId === div.phaseId).sort((a, b) => a.rank - b.rank)
    const idx = inPhase.findIndex((d) => d.id === div.id)
    return idx > 0
  }
  const getCanMoveDown = (div: Division) => {
    const inPhase = divisions.filter((d) => d.phaseId === div.phaseId).sort((a, b) => a.rank - b.rank)
    const idx = inPhase.findIndex((d) => d.id === div.id)
    return idx >= 0 && idx < inPhase.length - 1
  }

  const openEdit = (div: Division) => {
    setEditing(div)
    setCreating(false)
    setForm({
      phaseId: div.phaseId,
      displayName: div.displayName,
      rank: div.rank,
      playersPerGame: div.playersPerGame,
    })
  }

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    const phaseId = phases[0]?.id ?? ''
    const maxRank =
      phaseId && divisions.filter((d) => d.phaseId === phaseId).length > 0
        ? Math.max(...divisions.filter((d) => d.phaseId === phaseId).map((d) => d.rank)) + 1
        : 1
    setForm({
      phaseId,
      displayName: '',
      rank: maxRank,
      playersPerGame: 4,
    })
  }

  const closeModal = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleSave = () => {
    if (editing) {
      updateDivision(editing.id, {
        displayName: form.displayName,
        rank: form.rank,
        playersPerGame: form.playersPerGame,
      })
      closeModal()
    } else if (creating && form.phaseId) {
      addDivision({
        phaseId: form.phaseId,
        displayName: form.displayName,
        rank: form.rank,
        playersPerGame: form.playersPerGame,
      })
      closeModal()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Divisions</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ajouter une division
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
              <th scope="col" className="px-4 py-3 text-center text-sm font-medium text-slate-700 w-24">
                Ordre
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Joueurs / match
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {divisionsByPhase.map((div) => (
              <tr key={div.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{div.displayName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{getPhaseName(div.phaseId)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveDivisionUp(div.id)}
                      disabled={!getCanMoveUp(div)}
                      title="Monter"
                      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Monter"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDivisionDown(div.id)}
                      disabled={!getCanMoveDown(div)}
                      title="Descendre"
                      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Descendre"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{div.playersPerGame}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(div)}
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
          aria-labelledby="edit-division-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="edit-division-title" className="font-display text-lg font-semibold text-slate-800">
              {creating ? 'Ajouter une division' : 'Modifier la division'}
            </h2>
            <div className="mt-4 space-y-4">
              {creating && (
                <div>
                  <label htmlFor="edit-phaseId" className="block text-sm font-medium text-slate-700">
                    Phase
                  </label>
                  <select
                    id="edit-phaseId"
                    value={form.phaseId}
                    onChange={(e) => {
                      const phaseId = e.target.value
                      const inPhase = divisions.filter((d) => d.phaseId === phaseId)
                      const maxRank = inPhase.length > 0 ? Math.max(...inPhase.map((d) => d.rank)) + 1 : 1
                      setForm((f) => ({ ...f, phaseId, rank: maxRank }))
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>{p.displayName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="edit-displayName" className="block text-sm font-medium text-slate-700">
                  Nom de la division
                </label>
                <input
                  id="edit-displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {creating && (
                <div>
                  <label htmlFor="edit-rank" className="block text-sm font-medium text-slate-700">
                    Rang (ordre dans la phase)
                  </label>
                  <input
                    id="edit-rank"
                    type="number"
                    min={1}
                    value={form.rank}
                    onChange={(e) => setForm((f) => ({ ...f, rank: Number(e.target.value) || 1 }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}
              <div>
                <label htmlFor="edit-playersPerGame" className="block text-sm font-medium text-slate-700">
                  Joueurs par match
                </label>
                <input
                  id="edit-playersPerGame"
                  type="number"
                  min={1}
                  value={form.playersPerGame}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, playersPerGame: Number(e.target.value) || 1 }))
                  }
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
