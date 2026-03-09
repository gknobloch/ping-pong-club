import { useState, useEffect } from 'react'
import type { Address, Club } from '@/types'
import { useMockData } from '@/contexts/MockDataContext'
import { useClubAddressFormState } from '@/pages/useClubAddressForm'

const emptyAddressForm = {
  label: '',
  street: '',
  postalCode: '',
  city: '',
  isDefault: false,
}

export interface ClubDetailViewProps {
  club: Club
  canEdit: boolean
  /** When true, N° affiliation can be edited (reserved for global admin). Default false. */
  canEditAffiliationNumber?: boolean
  /** Called after saving club (e.g. to navigate to new URL if affiliation number changed). */
  onClubSaved?: (patch: { affiliationNumber: string; displayName: string }) => void
  /** Prefix for input ids to avoid duplicates when multiple instances exist. */
  idPrefix?: string
}

export function ClubDetailView({
  club,
  canEdit,
  canEditAffiliationNumber = false,
  onClubSaved,
  idPrefix = 'club-detail',
}: ClubDetailViewProps) {
  const { updateClub, addClubAddress, updateClubAddress, deleteClubAddress } = useMockData()
  const [form, setForm] = useState({ affiliationNumber: club.affiliationNumber, displayName: club.displayName })
  const [addressForm, setAddressForm] = useClubAddressFormState()
  const [addressFields, setAddressFields] = useState(emptyAddressForm)

  useEffect(() => {
    setForm({
      affiliationNumber: club.affiliationNumber,
      displayName: club.displayName,
    })
  }, [club.id, club.affiliationNumber, club.displayName])

  const handleSaveClub = () => {
    updateClub(club.id, form)
    onClubSaved?.(form)
  }

  const openAddAddress = () => {
    setAddressForm({ mode: 'add' })
    setAddressFields(emptyAddressForm)
  }

  const openEditAddress = (address: Address) => {
    setAddressForm({ mode: 'edit', address })
    setAddressFields({
      label: address.label,
      street: address.street,
      postalCode: address.postalCode,
      city: address.city,
      isDefault: address.isDefault,
    })
  }

  const closeAddressForm = () => {
    setAddressForm(null)
  }

  const handleSaveAddress = () => {
    if (addressForm?.mode === 'add') {
      addClubAddress(club.id, addressFields)
      closeAddressForm()
    } else if (addressForm?.mode === 'edit') {
      updateClubAddress(club.id, addressForm.address.id, addressFields)
      closeAddressForm()
    }
  }

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm('Supprimer cette adresse ?')) {
      deleteClubAddress(club.id, addressId)
      if (addressForm?.mode === 'edit' && addressForm.address.id === addressId) {
        closeAddressForm()
      }
    }
  }

  const handleSetDefaultAddress = (addressId: string) => {
    updateClubAddress(club.id, addressId, { isDefault: true })
  }

  const addresses = club.addresses ?? []

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-medium text-slate-800">Informations du club</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor={`${idPrefix}-affiliationNumber`}
              className="block text-sm font-medium text-slate-700"
            >
              N° affiliation
            </label>
            <input
              id={`${idPrefix}-affiliationNumber`}
              type="text"
              value={form.affiliationNumber}
              onChange={(e) =>
                canEdit &&
                canEditAffiliationNumber &&
                setForm((f) => ({ ...f, affiliationNumber: e.target.value }))
              }
              readOnly={!canEdit || !canEditAffiliationNumber}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-displayName`}
              className="block text-sm font-medium text-slate-700"
            >
              Nom
            </label>
            <input
              id={`${idPrefix}-displayName`}
              type="text"
              value={form.displayName}
              onChange={(e) => canEdit && setForm((f) => ({ ...f, displayName: e.target.value }))}
              readOnly={!canEdit}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>
        </div>
        {canEdit && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveClub}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-slate-800">
            Adresses (lieux de jeu)
          </h2>
          {canEdit && (
            <button
              type="button"
              onClick={openAddAddress}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Ajouter une adresse
            </button>
          )}
        </div>
        <ul className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          {addresses.length === 0 && !addressForm && (
            <li className="text-sm text-slate-500">Aucune adresse.</li>
          )}
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-slate-900">{a.label}</span>
                {a.isDefault && (
                  <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">
                    Par défaut
                  </span>
                )}
                <p className="text-slate-600">
                  {a.street}, {a.postalCode} {a.city}
                </p>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditAddress(a)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Modifier
                  </button>
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(a.id)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      Par défaut
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {canEdit && addressForm && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-medium text-slate-700">
              {addressForm.mode === 'add' ? 'Nouvelle adresse' : "Modifier l'adresse"}
            </h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Libellé</label>
                <input
                  type="text"
                  value={addressFields.label}
                  onChange={(e) => setAddressFields((f) => ({ ...f, label: e.target.value }))}
                  placeholder="ex. Gymnase principal"
                  className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Rue</label>
                <input
                  type="text"
                  value={addressFields.street}
                  onChange={(e) => setAddressFields((f) => ({ ...f, street: e.target.value }))}
                  className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600">Code postal</label>
                  <input
                    type="text"
                    value={addressFields.postalCode}
                    onChange={(e) =>
                      setAddressFields((f) => ({ ...f, postalCode: e.target.value }))
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-medium text-slate-600">Ville</label>
                  <input
                    type="text"
                    value={addressFields.city}
                    onChange={(e) => setAddressFields((f) => ({ ...f, city: e.target.value }))}
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressFields.isDefault}
                  onChange={(e) =>
                    setAddressFields((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Adresse par défaut</span>
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAddressForm}
                className="rounded bg-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
