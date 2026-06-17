'use client'

import type { Cv } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteCv } from '@/lib/api'

export default function CvCard({ cv }: { cv: Cv }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Supprimer le CV "${cv.title}" ?`)) return
    setDeleting(true)
    try {
      await deleteCv(cv.id)
      router.refresh()
    } catch {
      alert('Erreur lors de la suppression du CV.')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-white truncate">{cv.title}</h3>
        {cv.isPremium && (
          <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full px-2 py-0.5 ml-2 shrink-0">
            Premium
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-500 mb-1">Template : {cv.templateKey}</p>
      <p className="text-xs text-neutral-500 mb-4">
        {new Date(cv.updatedAt).toLocaleDateString('fr-FR')}
      </p>

      <div className="flex gap-2">
        <Link
          href={`/cv/${cv.id}`}
          className="flex-1 text-center text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 transition"
        >
          Voir
        </Link>
        <Link
          href={`/cv/${cv.id}/edit`}
          className="flex-1 text-center text-sm bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 rounded-lg px-3 py-2 transition"
        >
          Modifier
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? '...' : 'Supprimer'}
        </button>
      </div>
    </div>
  )
}
