import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Club } from '@/types'
import { useAppData } from '@/contexts/DataContext'

export function ClubsPage() {
  const navigate = useNavigate()
  const { clubs, addClub, archiveClub } = useAppData()
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState({ affiliationNumber: '', displayName: '' })

  const activeClubs = clubs.filter((c) => !c.isArchived)
  const archivedClubs = clubs.filter((c) => c.isArchived)
  const visibleClubs = showArchived ? clubs : activeClubs

  const openEdit = (club: Club) => {
    navigate(`/clubs/${club.affiliationNumber}`)
  }

  const openCreate = () => {
    setCreating(true)
    setForm({ affiliationNumber: '', displayName: '' })
  }

  const handleSave = () => {
    if (creating) {
      addClub({ ...form, isArchived: false, addresses: [] })
      setCreating(false)
    }
  }

  const handleArchive = (club: Club) => {
    if (window.confirm(`Archiver le club "${club.displayName}" ? Il ne sera plus visible dans la liste active.`)) {
      archiveClub(club.id)
    }
  }

  const closeCreateModal = () => {
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Clubs</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ajouter un club
        </button>
      </div>
      {archivedClubs.length > 0 && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-600">
            Afficher les clubs archivés ({archivedClubs.length})
          </span>
        </label>
      )}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                N° affiliation
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Nom
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Lieux de jeu
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {visibleClubs.map((club) => (
              <tr key={club.id} className={`hover:bg-slate-50/50 ${club.isArchived ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-sm text-slate-900 font-mono">
                  {club.affiliationNumber}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {club.displayName}
                  {club.isArchived && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                      Archivé
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {(club.addresses ?? []).map((a) => a.label).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    type="button"
                    onClick={() => openEdit(club)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Modifier
                  </button>
                  {!club.isArchived && (
                    <button
                      type="button"
                      onClick={() => handleArchive(club)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Archiver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-club-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h2 id="create-club-title" className="font-display text-lg font-semibold text-slate-800">
              Ajouter un club
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="create-affiliationNumber"
                  className="block text-sm font-medium text-slate-700"
                >
                  N° affiliation
                </label>
                <input
                  id="create-affiliationNumber"
                  type="text"
                  value={form.affiliationNumber}
                  onChange={(e) => setForm((f) => ({ ...f, affiliationNumber: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label
                  htmlFor="create-displayName"
                  className="block text-sm font-medium text-slate-700"
                >
                  Nom
                </label>
                <input
                  id="create-displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
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
