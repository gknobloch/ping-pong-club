import { useMemo, useState } from 'react'
import { useAppData, type FfttTeamsPreview, type FfttTeamsImportResult } from '@/contexts/DataContext'
import { ModalShell } from '@/components/ModalShell'

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9) // 9..21
const MINUTES = ['00', '15', '30', '45']

type PreviewState = 'idle' | 'loading' | 'done' | 'error'

/**
 * FFTT teams import dialog for the Teams admin page (#229). The Global Admin
 * picks a club; a Club Admin is locked to their own (`lockedClubId`).
 */
export function ImportTeamsModal({ onClose, lockedClubId }: { onClose: () => void; lockedClubId?: string }) {
  const { clubs, fetchTeamsPreview, importFfttTeams } = useAppData()

  const selectableClubs = clubs.filter((c) => !c.isArchived)
  const [clubId, setClubId] = useState(lockedClubId ?? '')

  const [preview, setPreview] = useState<FfttTeamsPreview | null>(null)
  const [previewState, setPreviewState] = useState<PreviewState>('idle')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(false)
  const [imported, setImported] = useState<FfttTeamsImportResult | null>(null)

  // Defaults applied to every imported team; completed per-team afterwards.
  const [gameLocationId, setGameLocationId] = useState('')
  const [defaultDay, setDefaultDay] = useState('')
  const [timeHour, setTimeHour] = useState('')
  const [timeMinute, setTimeMinute] = useState('00')
  const defaultTime = timeHour ? `${timeHour}h${timeMinute}` : ''

  const club = clubs.find((c) => c.id === clubId)
  const addresses = club?.addresses ?? []

  const handleSearch = async () => {
    setPreviewState('loading')
    setPreview(null)
    setImported(null)
    setImportError(false)
    const result = await fetchTeamsPreview(clubId)
    if (result === 'club_not_found' || result === null) {
      setPreviewState('error')
    } else {
      setPreview(result)
      setPreviewState('done')
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0]
      setGameLocationId(defaultAddr?.id ?? '')
    }
  }

  const importable = useMemo(() => (preview?.teams ?? []).filter((t) => t.importable), [preview])
  const seasonMissing = !!preview && !preview.season.exists

  const handleImport = async () => {
    setImporting(true)
    setImportError(false)
    const result = await importFfttTeams(clubId, { gameLocationId, defaultDay, defaultTime })
    setImporting(false)
    if (result) {
      setImported(result)
      setPreview(null)
      setPreviewState('idle')
    } else {
      setImportError(true)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20'

  const badge = (t: FfttTeamsPreview['teams'][number]) => {
    if (t.exists) return { label: 'Déjà présente', className: 'bg-slate-100 text-slate-500' }
    if (seasonMissing) return { label: 'Saison manquante', className: 'bg-amber-100 text-amber-700' }
    if (!t.divisionExists && t.importable) return { label: 'Division à importer', className: 'bg-sky-100 text-sky-700' }
    if (!t.importable) return { label: 'Division inconnue', className: 'bg-amber-100 text-amber-700' }
    return null
  }

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="import-teams-title"
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 id="import-teams-title" className="font-display text-lg font-semibold text-slate-800">
          Importer les équipes FFTT
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="import-teams-club" className="block text-sm font-medium text-slate-700">
              Club
            </label>
            <select
              id="import-teams-club"
              value={clubId}
              onChange={(e) => {
                setClubId(e.target.value)
                setPreview(null)
                setPreviewState('idle')
                setImported(null)
              }}
              disabled={!!lockedClubId}
              className={`${inputClass} disabled:bg-slate-100`}
            >
              {!lockedClubId && <option value="">Choisir un club…</option>}
              {selectableClubs.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName} ({c.affiliationNumber})</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!clubId || previewState === 'loading'}
            className="w-full rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            {previewState === 'loading' ? 'Recherche…' : 'Rechercher les équipes'}
          </button>

          {previewState === 'error' && (
            <p className="text-sm text-red-600">
              Impossible de contacter l’API FFTT. Réessayez plus tard.
            </p>
          )}

          {imported && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 space-y-1">
              <p className="text-sm text-green-800">
                {imported.createdTeams.length === 0
                  ? 'Aucune équipe à importer : elles sont toutes déjà présentes.'
                  : `${imported.createdTeams.length} équipe${imported.createdTeams.length > 1 ? 's' : ''} importée${imported.createdTeams.length > 1 ? 's' : ''}.`}
              </p>
              {imported.createdDivisions.length > 0 && (
                <p className="text-sm text-green-800">
                  {imported.createdDivisions.length} division{imported.createdDivisions.length > 1 ? 's' : ''} importée{imported.createdDivisions.length > 1 ? 's' : ''} automatiquement.
                </p>
              )}
              {imported.createdTeams.length > 0 && (
                <p className="text-sm text-green-800">
                  Complétez maintenant chaque équipe (joueurs, capitaine) via « Modifier ».
                </p>
              )}
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Saison FFTT : <span className="font-medium text-slate-800">{preview.season.displayName}</span>
              </p>
              {seasonMissing && (
                <p className="text-sm text-amber-700">
                  La saison {preview.season.displayName} n’existe pas encore : créez-la depuis la page Saisons avant d’importer.
                </p>
              )}
              {preview.teams.length === 0 ? (
                <p className="text-sm text-slate-600">Aucune équipe engagée trouvée pour ce club.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {preview.teams.map((t) => {
                    const b = badge(t)
                    return (
                      <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <span className={`min-w-0 ${t.importable ? 'text-slate-800' : 'text-slate-400'}`}>
                          <span className="font-medium">{t.label}</span>
                          <span className="ml-2 text-xs text-slate-400">
                            {t.divisionName}{t.poolNumber !== null ? ` · Poule ${t.poolNumber}` : ''}
                          </span>
                        </span>
                        {b && (
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${b.className}`}>{b.label}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {importable.length > 0 && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-700">
                    Valeurs par défaut des équipes importées
                  </p>
                  <div>
                    <label htmlFor="import-teams-location" className="block text-sm font-medium text-slate-700">
                      Lieu de jeu
                    </label>
                    <select
                      id="import-teams-location"
                      value={gameLocationId}
                      onChange={(e) => setGameLocationId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Choisir un lieu…</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label htmlFor="import-teams-day" className="block text-sm font-medium text-slate-700">
                        Jour
                      </label>
                      <select
                        id="import-teams-day"
                        value={defaultDay}
                        onChange={(e) => setDefaultDay(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="import-teams-hour" className="block text-sm font-medium text-slate-700">Heure</label>
                      <div className="mt-1 flex items-center gap-1">
                        <select
                          id="import-teams-hour"
                          value={timeHour}
                          onChange={(e) => setTimeHour(e.target.value)}
                          aria-label="Heure"
                          className={`${inputClass} mt-0`}
                        >
                          <option value="">—</option>
                          {HOURS.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="font-medium text-slate-500">h</span>
                        <select
                          value={timeMinute}
                          onChange={(e) => setTimeMinute(e.target.value)}
                          disabled={!timeHour}
                          aria-label="Minutes"
                          className={`${inputClass} mt-0 disabled:bg-slate-100`}
                        >
                          {MINUTES.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {importError && (
                <p className="text-sm text-red-600">Échec de l’import, réessayez.</p>
              )}
              {preview.teams.length > 0 && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || importable.length === 0 || !gameLocationId}
                  className="w-full rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  {importing
                    ? 'Import…'
                    : importable.length === 0
                      ? 'Rien à importer'
                      : `Importer ${importable.length} équipe${importable.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
