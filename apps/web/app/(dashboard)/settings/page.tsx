'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteAccountData, deleteAccount } from '@/lib/api'
import { Trash2, AlertTriangle, X } from 'lucide-react'

type Action = 'data' | 'account' | null

const CONFIRM_WORD = 'CONFIRMER'

export default function SettingsPage() {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<Action>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openModal(action: Action) {
    setActiveAction(action)
    setConfirmInput('')
    setError(null)
  }

  function closeModal() {
    if (loading) return
    setActiveAction(null)
    setConfirmInput('')
    setError(null)
  }

  async function handleConfirm() {
    if (confirmInput !== CONFIRM_WORD || !activeAction) return
    setLoading(true)
    setError(null)

    try {
      if (activeAction === 'data') {
        await deleteAccountData()
        // Données supprimées, l'utilisateur reste connecté → dashboard vide
        router.push('/dashboard')
        router.refresh()
      } else {
        await deleteAccount()
        // Compte supprimé → déconnexion locale + landing
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  const isDataAction = activeAction === 'data'
  const modalTitle = isDataAction
    ? 'Supprimer toutes mes données'
    : 'Supprimer mon compte'
  const modalDesc = isDataAction
    ? 'Vos CVs, versions et paiements seront définitivement supprimés. Votre compte restera actif et vous pourrez recommencer.'
    : 'Votre compte et toutes les données associées (CVs, versions, paiements) seront définitivement supprimés. Cette action est irréversible.'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif mb-8">Paramètres</h1>

      {/* Zone dangereuse */}
      <div className="border border-red-900/60 rounded-2xl overflow-hidden">
        <div className="bg-red-950/30 px-6 py-4 border-b border-red-900/60 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-red-400">Zone dangereuse</h2>
        </div>

        <div className="divide-y divide-neutral-800">
          {/* Supprimer les données */}
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-sm">Supprimer toutes mes données CV</p>
              <p className="text-neutral-400 text-xs mt-1">
                Supprime vos CVs et leur contenu. Votre compte reste actif.
              </p>
            </div>
            <button
              onClick={() => openModal('data')}
              className="shrink-0 flex items-center gap-2 border border-red-700 text-red-400 hover:bg-red-950/40 text-sm px-4 py-2 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" /> Supprimer mes données
            </button>
          </div>

          {/* Supprimer le compte */}
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-sm">Supprimer mon compte</p>
              <p className="text-neutral-400 text-xs mt-1">
                Supprime définitivement votre compte et toutes les données associées.
              </p>
            </div>
            <button
              onClick={() => openModal('account')}
              className="shrink-0 flex items-center gap-2 bg-red-950/60 border border-red-700 text-red-400 hover:bg-red-900/60 text-sm px-4 py-2 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" /> Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Close */}
            <button
              onClick={closeModal}
              disabled={loading}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-950/60 border border-red-900 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>

            <h3 className="text-lg font-semibold mb-2">{modalTitle}</h3>
            <p className="text-neutral-400 text-sm mb-6">{modalDesc}</p>

            <div className="mb-4">
              <label className="block text-sm text-neutral-300 mb-2">
                Tapez <span className="font-mono font-bold text-white">{CONFIRM_WORD}</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder={CONFIRM_WORD}
                autoFocus
                disabled={loading}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={loading}
                className="flex-1 border border-neutral-700 text-white text-sm py-2.5 rounded-lg hover:border-neutral-500 transition disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmInput !== CONFIRM_WORD || loading}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Suppression…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
