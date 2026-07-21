import { useState } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { fetchClubDetailXmlFromBrowser, parseClubDetailXml, type FfttClubDetail } from '@/lib/ffttClub'
import { ModalShell } from '@/components/ModalShell'

type SearchState = 'idle' | 'loading' | 'found' | 'not_found' | 'already_exists' | 'error'

/**
 * FFTT club import dialog for the Clubs admin page (#247). A single club has
 * no related entities to reconcile (unlike divisions/teams/games), so this
 * reuses the plain manual-creation flow (`addClub`) once the FFTT detail is
 * fetched and parsed — no dedicated preview/import API endpoint needed.
 */
export function ImportClubModal({ onClose }: { onClose: () => void }) {
  const { clubs, addClub } = useAppData()

  const [affiliationNumber, setAffiliationNumber] = useState('')
  const [state, setState] = useState<SearchState>('idle')
  const [detail, setDetail] = useState<FfttClubDetail | null>(null)
  const [imported, setImported] = useState(false)

  const handleSearch = async () => {
    setState('loading')
    setDetail(null)
    const xml = await fetchClubDetailXmlFromBrowser(affiliationNumber)
    if (xml === null) {
      setState('error')
      return
    }
    const parsed = parseClubDetailXml(xml)
    if (!parsed) {
      setState('not_found')
      return
    }
    if (clubs.some((c) => c.affiliationNumber === parsed.affiliationNumber)) {
      setState('already_exists')
      return
    }
    setDetail(parsed)
    setState('found')
  }

  const handleImport = () => {
    if (!detail) return
    addClub({
      affiliationNumber: detail.affiliationNumber,
      displayName: detail.displayName,
      isArchived: false,
      addresses: [{
        id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: detail.venueLabel, street: detail.street,
        postalCode: detail.postalCode, city: detail.city, isDefault: true,
      }],
      channels: [],
    })
    setImported(true)
    setDetail(null)
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20'

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="import-club-title"
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h2 id="import-club-title" className="font-display text-lg font-semibold text-slate-800">
          Importer un club depuis la FFTT
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="import-club-number" className="block text-sm font-medium text-slate-700">
              N° affiliation
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="import-club-number"
                type="text"
                value={affiliationNumber}
                onChange={(e) => { setAffiliationNumber(e.target.value); setState('idle'); setDetail(null); setImported(false) }}
                className={`${inputClass} mt-0 flex-1`}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={!affiliationNumber || state === 'loading'}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
              >
                {state === 'loading' ? 'Recherche…' : 'Rechercher'}
              </button>
            </div>
          </div>

          {state === 'error' && (
            <p className="text-sm text-red-600">Impossible de contacter la FFTT. Réessayez plus tard.</p>
          )}
          {state === 'not_found' && (
            <p className="text-sm text-slate-600">Aucun club trouvé pour ce numéro d’affiliation.</p>
          )}
          {state === 'already_exists' && (
            <p className="text-sm text-amber-700">Un club avec ce numéro d’affiliation existe déjà.</p>
          )}
          {imported && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm text-green-800">Club importé.</p>
            </div>
          )}

          {detail && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <p className="font-medium text-slate-800">{detail.displayName}</p>
                <p className="text-slate-500">
                  {detail.venueLabel} · {detail.street}, {detail.postalCode} {detail.city}
                </p>
              </div>
              <button
                type="button"
                onClick={handleImport}
                className="w-full rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
              >
                Importer ce club
              </button>
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
