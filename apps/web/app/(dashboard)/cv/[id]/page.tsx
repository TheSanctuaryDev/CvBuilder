'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, FileText, ArrowRight, Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import PayButton from '@/components/PayButton'
import { trackEvent } from '@/components/PostHogProvider'
import type { Cv } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

async function getToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

type GenerateStatus = 'idle' | 'connecting' | 'generating' | 'done' | 'error'

export default function CvDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { id } = use(params)
  const { payment } = use(searchParams)
  const router = useRouter()

  const [cv, setCv] = useState<Cv | null>(null)
  const [loading, setLoading] = useState(true)
  const [genStatus, setGenStatus] = useState<GenerateStatus>('idle')
  const [genMsg, setGenMsg] = useState('')
  const [genProvider, setGenProvider] = useState('')
  const isGeneratingRef = useRef(false)   // BUG-09 : guard double-clic SSE
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null) // BUG-20

  useEffect(() => {
    return () => { if (navTimerRef.current) clearTimeout(navTimerRef.current) } // BUG-20
  }, [])

  useEffect(() => {
    async function load() {
      const token = await getToken()
      if (!token) { router.push('/login'); return }
      try {
        const res = await fetch(`${API_URL}/api/cvs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (res.status === 404) { router.push('/dashboard'); return }
        if (!res.ok) { router.push('/dashboard'); return }
        setCv(await res.json()) // BUG-06 : json() peut throw, wrappé dans try/catch
        setLoading(false)
      } catch { router.push('/dashboard') }
    }
    load()
  }, [id, router])

  // Email "paiement confirmé" + event analytics — fire-and-forget quand l'user revient après paiement
  useEffect(() => {
    if (payment !== 'success') return
    trackEvent('payment_success', { cvId: id, provider: 'fedapay' })
    fetch('/api/emails/payment-confirmed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvId: id }),
    }).catch(() => {})
  }, [id, payment])

  async function handleGenerate() {
    // BUG-09 : guard synchrone contre les doubles appels
    if (isGeneratingRef.current) return
    isGeneratingRef.current = true
    trackEvent('cv_generation_started', { cvId: id, templateKey: cv?.templateKey })
    setGenStatus('connecting')
    setGenMsg('Connexion au service IA...')
    setGenProvider('')

    const token = await getToken()

    const res = await fetch(`${API_URL}/api/generate/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok || !res.body) {
      setGenStatus('error')
      setGenMsg('Erreur de connexion au service IA.')
      isGeneratingRef.current = false
      return
    }

    setGenStatus('generating')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))
          if (evt.type === 'status') {
            setGenMsg(evt.data.msg)
          } else if (evt.type === 'done') {
            setGenProvider(evt.data.provider ?? '')
            setGenStatus('done')
            setGenMsg('CV enrichi avec succès !')
            trackEvent('cv_generation_success', { cvId: id, provider: evt.data.provider })
            isGeneratingRef.current = false
            const token2 = await getToken()
            const r = await fetch(`${API_URL}/api/cvs/${id}`, {
              headers: { Authorization: `Bearer ${token2}` },
              cache: 'no-store',
            })
            if (r.ok) setCv(await r.json())
            // BUG-20 : stocker le timer pour pouvoir l'annuler si démontage
            navTimerRef.current = setTimeout(() => router.push(`/cv/${id}/edit`), 1200)
          } else if (evt.type === 'error') {
            setGenStatus('error')
            setGenMsg(evt.data.msg ?? 'Erreur lors de la génération.')
            isGeneratingRef.current = false
          }
        } catch {
          // ligne SSE malformée, on ignore
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center h-64 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }

  if (!cv) return null

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
            <span className="font-semibold capitalize">{cv.templateKey}</span>
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
            <span className="text-neutral-400 block mb-1">Version</span>
            <span>{cv.currentVersion > 0 ? `v${cv.currentVersion}` : 'Données saisies'}</span>
          </div>
        </div>
      </div>

      {/* Génération IA */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-sm">Enrichissement IA</h2>
        </div>
        <p className="text-neutral-400 text-sm mb-4">
          L&apos;IA analyse vos données et reformule votre CV de manière professionnelle — résumé percutant, expériences valorisées, compétences mises en avant.
        </p>

        {genStatus === 'idle' && (
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <Sparkles className="w-4 h-4" />
            Générer avec l&apos;IA
          </button>
        )}

        {(genStatus === 'connecting' || genStatus === 'generating') && (
          <div className="flex items-center gap-3 text-sm text-neutral-300">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
            <span>{genMsg}</span>
          </div>
        )}

        {genStatus === 'done' && (
          <div className="flex items-center gap-3 text-sm text-green-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{genMsg}{genProvider && ` (${genProvider})`} — Ouverture de l&apos;éditeur…</span>
          </div>
        )}

        {genStatus === 'error' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{genMsg}</span>
            </div>
            <button
              onClick={() => setGenStatus('idle')}
              className="text-sm text-neutral-400 hover:text-white transition underline"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Ouvrir l'éditeur */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 text-center">
        <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
        <h2 className="font-semibold mb-2 text-sm">Éditeur visuel</h2>
        <p className="text-neutral-400 text-sm mb-4">
          Retouchez chaque section, réorganisez le contenu et exportez en PDF ou Word.
        </p>
        <Link
          href={`/cv/${cv.id}/edit`}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2 rounded-lg hover:bg-neutral-200 transition"
        >
          Ouvrir l&apos;éditeur <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Paiement premium */}
      {cv.isPremium && !cv.isPaid && (
        <div className="flex gap-3">
          <PayButton cvId={cv.id} />
        </div>
      )}
    </div>
  )
}
