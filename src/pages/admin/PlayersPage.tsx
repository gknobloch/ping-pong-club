import { useMemo, useState } from 'react'
import type { Player as PlayerType } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useMockData } from '@/contexts/MockDataContext'

const STATUS_LABELS: Record<PlayerType['status'], string> = {
  active: 'Actif',
  pending_validation: 'En attente',
  archived: 'Archivé',
}

export function PlayersPage() {
  const { user } = useAuth()
  const { players: allPlayers, clubs, updatePlayer, addPlayer } = useMockData()
  const [editing, setEditing] = useState<PlayerType | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    licenseNumber: '',
    email: '',
    phone: '',
    birthDate: '',
    birthPlace: '',
    status: 'active' as PlayerType['status'],
    clubId: '',
  })

  const isClubAdmin = user?.role === 'club_admin'
  const adminClubIds = user?.clubIds ?? []

  const players = useMemo(() => {
    if (isClubAdmin && adminClubIds.length) {
      return allPlayers.filter((p) => adminClubIds.includes(p.clubId))
    }
    return allPlayers
  }, [allPlayers, isClubAdmin, adminClubIds])

  const clubsForSelect =
    isClubAdmin && adminClubIds.length
      ? clubs.filter((c) => adminClubIds.includes(c.id))
      : clubs

  const adminClubNames = adminClubIds
    .map((id) => clubs.find((c) => c.id === id)?.displayName)
    .filter(Boolean)
    .join(', ')

  const getClubName = (clubId: string) =>
    clubs.find((c) => c.id === clubId)?.displayName ?? clubId

  const openEdit = (player: PlayerType) => {
    setEditing(player)
    setCreating(false)
    setForm({
      firstName: player.firstName,
      lastName: player.lastName,
      licenseNumber: player.licenseNumber,
      email: player.email,
      phone: player.phone ?? '',
      birthDate: player.birthDate ?? '',
      birthPlace: player.birthPlace ?? '',
      status: player.status,
      clubId: player.clubId,
    })
  }

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({
      firstName: '',
      lastName: '',
      licenseNumber: '',
      email: '',
      phone: '',
      birthDate: '',
      birthPlace: '',
      status: 'active',
      clubId: clubsForSelect[0]?.id ?? '',
    })
  }

  const closeModal = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleSave = () => {
    if (editing) {
      updatePlayer(editing.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        licenseNumber: form.licenseNumber,
        email: form.email,
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
        birthPlace: form.birthPlace || undefined,
        status: form.status,
      })
      closeModal()
      return
    }
    if (creating && form.clubId && form.firstName && form.lastName && form.email) {
      addPlayer({
        firstName: form.firstName,
        lastName: form.lastName,
        licenseNumber: form.licenseNumber,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate || undefined,
        birthPlace: form.birthPlace || undefined,
        status: form.status,
        clubId: form.clubId,
      })
      closeModal()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Joueurs</h1>
          {isClubAdmin && adminClubNames && (
            <p className="mt-1 text-sm text-slate-600">Club : {adminClubNames}</p>
          )}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ajouter un joueur
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Nom
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                N° licence
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Téléphone
              </th>
              {!isClubAdmin && (
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Club
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                Statut
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {player.firstName} {player.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                  {player.licenseNumber}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{player.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{player.phone || '—'}</td>
                {!isClubAdmin && (
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {getClubName(player.clubId)}
                  </td>
                )}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      player.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : player.status === 'pending_validation'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {STATUS_LABELS[player.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(player)}
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
          aria-labelledby="player-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg my-8">
            <h2 id="player-modal-title" className="font-display text-lg font-semibold text-slate-800">
              {creating ? 'Ajouter un joueur' : 'Modifier le joueur'}
            </h2>
            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Prénom</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">N° licence</label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Téléphone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Date de naissance (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.birthDate}
                    onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                    placeholder="JJ/MM/AAAA"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Lieu de naissance (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.birthPlace}
                    onChange={(e) => setForm((f) => ({ ...f, birthPlace: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              {(creating || editing) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as PlayerType['status'] }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {(Object.entries(STATUS_LABELS) as [PlayerType['status'], string][]).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
              {creating && clubsForSelect.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Club</label>
                  <select
                    value={form.clubId}
                    onChange={(e) => setForm((f) => ({ ...f, clubId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {clubsForSelect.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                  !form.firstName ||
                  !form.lastName ||
                  !form.email ||
                  (creating && !form.clubId)
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
