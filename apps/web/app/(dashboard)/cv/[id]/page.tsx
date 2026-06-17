import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Cv } from '@/types'

async function getCv(id: string, token: string): Promise<Cv | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  try {
    const res = await fetch(`${apiUrl}/api/cvs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function CvDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const cv = await getCv(id, session.access_token)
  if (!cv) notFound()

  const formatted = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(cv.createdAt))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-neutral-400 hover:text-white text-sm transition mb-2 inline-block">
            ← Mes CVs
          </Link>
          <h1 className="text-3xl font-serif">{cv.title}</h1>
          <p className="text-neutral-400 text-sm mt-1">Créé le {formatted}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/cv/${cv.id}/edit`}
            className="border border-neutral-700 text-white text-sm px-4 py-2 rounded-lg hover:border-neutral-500 transition"
          >
            Modifier
          </Link>
          <Link
            href={`/cv/${cv.id}/versions`}
            className="border border-neutral-700 text-white text-sm px-4 py-2 rounded-lg hover:border-neutral-500 transition"
          >
            Versions
          </Link>
        </div>
      </div>

      {/* Infos CV */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-400 block mb-1">Template</span>
            <span className="font-semibold">{cv.templateKey}</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1">Type</span>
            <span className={cv.isPremium ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
              {cv.isPremium ? 'Premium' : 'Gratuit'}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1">Statut paiement</span>
            <span className={cv.isPaid ? 'text-green-400' : 'text-neutral-500'}>
              {cv.isPaid ? 'Payé' : cv.isPremium ? 'Non payé' : '—'}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1">Version actuelle</span>
            <span>{cv.currentVersion > 0 ? `v${cv.currentVersion}` : 'Pas encore généré'}</span>
          </div>
        </div>
      </div>

      {/* PDF preview placeholder */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6 text-center">
        <div className="text-4xl mb-3">📄</div>
        <h2 className="font-semibold mb-2">Aperçu PDF</h2>
        <p className="text-neutral-400 text-sm mb-4">
          La génération IA et l&apos;aperçu PDF seront disponibles en Phase 3.
        </p>
        <span className="inline-block bg-neutral-800 text-neutral-400 text-xs px-3 py-1 rounded-full">
          Phase 3 — Claude AI + Playwright PDF
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          disabled
          className="flex-1 bg-neutral-800 text-neutral-500 font-semibold py-3 rounded-xl cursor-not-allowed text-sm"
        >
          Générer avec l&apos;IA (Phase 3)
        </button>
        {cv.isPremium && !cv.isPaid && (
          <button
            disabled
            className="flex-1 border border-amber-400/30 text-amber-400/40 font-semibold py-3 rounded-xl cursor-not-allowed text-sm"
          >
            Débloquer — 2000 FCFA (Phase 3)
          </button>
        )}
      </div>
    </div>
  )
}
