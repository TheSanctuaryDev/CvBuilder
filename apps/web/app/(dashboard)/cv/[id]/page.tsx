import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PayButton from '@/components/PayButton'
import { ChevronLeft, FileText, ArrowRight } from 'lucide-react'
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

export default async function CvDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { id } = await params
  const { payment } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const cv = await getCv(id, session.access_token)
  if (!cv) notFound()

  const formatted = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(cv.createdAt))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Bannière succès paiement */}
      {payment === 'success' && (
        <div className="bg-green-950 border border-green-700 text-green-300 rounded-xl px-4 py-3 mb-6 text-sm">
          Paiement validé — votre CV premium est maintenant débloqué.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-neutral-400 hover:text-white text-sm transition mb-2">
            <ChevronLeft className="w-4 h-4" /> Mes CVs
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
            <span className={cv.isPremium ? 'text-white font-semibold' : 'text-neutral-300'}>
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
        <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
        <h2 className="font-semibold mb-2">Aperçu du CV</h2>
        <p className="text-neutral-400 text-sm mb-4">
          Ouvrez l&apos;éditeur pour modifier votre CV et l&apos;exporter en PDF ou Word.
        </p>
        <Link
          href={`/cv/${cv.id}/edit`}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2 rounded-lg hover:bg-neutral-200 transition"
        >
          Ouvrir l&apos;éditeur <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Actions */}
      {cv.isPremium && !cv.isPaid && (
        <div className="flex gap-3">
          <PayButton cvId={cv.id} />
        </div>
      )}
    </div>
  )
}
