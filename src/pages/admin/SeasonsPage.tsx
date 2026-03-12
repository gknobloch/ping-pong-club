import { useMemo, useState } from 'react'
import type { Season } from '@/types'
import { useAppData } from '@/contexts/DataContext'

export function SeasonsPage() {
  const { seasons: allSeasons, updateSeason, addSeason, archiveSeason, deleteSeason } = useAppData()
  const [editing, setEditing] = useState<Season | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ displayName: '', isActive: false, isArchived: false })
  const [showArchived, setShowArchived] = useState(false)

  const activeSeasons = useMemo(() => allSeasons.filter((s) => !s.isArchived), [allSeasons])
  const archivedSeasons = useMemo(() => allSeasons.filter((s) => s.isArchived), [allSeasons])
  const seasons = showArchived ? allSeasons : activeSeasons

  const openEdit = (season: Season) => {
    setEditing(season)
    setCreating(false)
    setForm({
      displayName: season.displayName,
      isActive: season.isActive,
      isArchived: season.isArchived,
    })
  }

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({ displayName: '', isActive: false, isArchived: false })
  }

  const handleSave = () => {
    if (editing) {
      updateSeason(editing.id, form)
      setEditing(null)
    } else if (creating) {
      addSeason(form)
      setCreating(false)
    }
  }

  const handleArchive = (season: Season) => {
    if (window.confirm(`Archiver la saison "${season.displayName}" ? Elle ne sera plus visible dans la liste active.`)) {
      archiveSeason(season.id)
    }
  }

  const handleDelete = (season: Season) => {
    if (window.confirm(`Supprimer définitivement la saison "${season.displayName}" ? Toutes les phases, divisions, groupes, équipes, journées, matchs, disponibilités et compositions associés seront également supprimés. Cette action est irréversible.`)) {
      deleteSeason(season.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Saisons</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ajouter une saison
        </button>
      </div>
      {archivedSeasons.length > 0 && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-600">
            Afficher les saisons archivées ({archivedSeasons.length})
          </span>
        </label>
      )}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
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
            {seasons.map((season) => (
              <tr key={season.id} className={`hover:bg-slate-50/50 ${season.isArchived ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {season.displayName}
                  {season.isArchived && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                      Archivée
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      season.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {season.isActive ? 'Active' : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {!season.isArchived && (
                    <button
                      type="button"
                      onClick={() => openEdit(season)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Modifier
                    </button>
                  )}
                  {!season.isArchived && (
                    <button
                      type="button"
                      onClick={() => handleArchive(season)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Archiver
                    </button>
                  )}
                  {season.isArchived && (
                    <button
                      type="button"
                      onClick={() => handleDelete(season)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  )}
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
          aria-labelledby="edit-season-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="edit-season-title" className="font-display text-lg font-semibold text-slate-800">
              {creating ? 'Ajouter une saison' : 'Modifier la saison'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-displayName" className="block text-sm font-medium text-slate-700">
                  Nom (ex. 2025/2026)
                </label>
                <input
                  id="edit-displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
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
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditing(null); setCreating(false) }}
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
