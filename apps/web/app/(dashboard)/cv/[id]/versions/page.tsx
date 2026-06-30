'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Clock, RotateCcw, Loader2, CheckCircle, AlertTriangle, History } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

async function getToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

type VersionSummary = { id: string; versionNum: number; createdAt: string }
type VersionDetail  = VersionSummary & { cvData: Record<string, unknown> | null }
type CvMeta         = { title: string; currentVersion: number }

function extractPreview(cvData: Record<string, unknown> | null): { name: string; sections: string[] } {
  if (!cvData) return { name: 'Données absentes', sections: [] }

  if (Array.isArray(cvData.sections)) {
    const sections = cvData.sections as Array<{ type: string; hidden?: boolean; [k: string]: unknown }>
    const header = sections.find(s => s.type === 'header') as Record<string, unknown> | undefined
    const name = (header?.firstName || header?.lastName)
      ? `${header?.firstName ?? ''} ${header?.lastName ?? ''}`.trim()
      : (header?.fullName as string) ?? 'Sans nom'
    const visibleTypes = sections
      .filter(s => !s.hidden)
      .map(s => sectionLabel(s.type as string))
      .filter(Boolean)
    return { name, sections: visibleTypes }
  }

  // Ancien format CvData
  const name = (cvData.fullName as string) || 'Sans nom'
  const sections: string[] = []
  if (cvData.summary)    sections.push('Profil')
  if (cvData.experience) sections.push('Expérience')
  if (cvData.formation)  sections.push('Formation')
  if (cvData.skills)     sections.push('Compétences')
  if (cvData.languages)  sections.push('Langues')
  return { name, sections }
}

function sectionLabel(type: string): string {
  const map: Record<string, string> = {
    header: 'En-tête', summary: 'Profil', experience: 'Expérience',
    formation: 'Formation', skills: 'Compétences', languages: 'Langues',
    interests: "Centres d'intérêt", references: 'Références', custom: 'Section personnalisée',
  }
  return map[type] ?? type
}

export default function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [cvMeta, setCvMeta]             = useState<CvMeta | null>(null)
  const [versions, setVersions]         = useState<VersionSummary[]>([])
  const [selected, setSelected]         = useState<VersionDetail | null>(null)
  const [loadingList, setLoadingList]   = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [restoring, setRestoring]       = useState(false)
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  useEffect(() => {
    async function load() {
      const token = await getToken()
      if (!token) { router.push('/login'); return }

      // BUG-06 : json() wrappé dans try/catch pour éviter le spinner infini
      try {
        const [cvRes, vRes] = await Promise.all([
          fetch(`${API_URL}/api/cvs/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
          fetch(`${API_URL}/api/cvs/${id}/versions`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
        ])

        if (!cvRes.ok || !vRes.ok) { router.push('/dashboard'); return }

        const cv = await cvRes.json()
        const vs = await vRes.json() as VersionSummary[]
        setCvMeta({ title: cv.title, currentVersion: cv.currentVersion })
        setVersions(vs)
        setLoadingList(false)

        // BUG-15 : await pour capturer les erreurs éventuelles
        if (vs.length > 0) await loadVersionDetail(vs[0].versionNum, token)
      } catch { router.push('/dashboard') }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadVersionDetail(vnum: number, tokenOverride?: string) {
    setLoadingDetail(true)
    setSelected(null)
    const token = tokenOverride ?? await getToken()
    const res = await fetch(`${API_URL}/api/cvs/${id}/versions/${vnum}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) setSelected(await res.json())
    setLoadingDetail(false)
  }

  async function handleRestore() {
    if (!selected) return
    setRestoring(true)
    setRestoreStatus('idle')
    const token = await getToken()
    const res = await fetch(`${API_URL}/api/cvs/${id}/restore/${selected.versionNum}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setRestoreStatus('ok')
      const vRes = await fetch(`${API_URL}/api/cvs/${id}/versions`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      })
      if (vRes.ok) {
        const vs = await vRes.json() as VersionSummary[]
        setVersions(vs)
        setCvMeta(prev => prev ? { ...prev, currentVersion: vs[0]?.versionNum ?? prev.currentVersion } : prev)
        loadVersionDetail(vs[0].versionNum, token)
      }
    } else {
      setRestoreStatus('error')
    }
    setRestoring(false)
  }

  const fmtDate  = (d: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(d))
  const fmtFull  = (d: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(d))

  if (loadingList) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }

  const preview = extractPreview(selected?.cvData ?? null)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cv/${id}`} className="text-neutral-400 hover:text-white transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">{cvMeta?.title}</h1>
          <p className="text-sm text-neutral-400 flex items-center gap-1.5 mt-0.5">
            <History className="w-3.5 h-3.5" />
            Historique des versions
          </p>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-500">
          <History className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p>Aucune version disponible pour ce CV.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          {/* Sidebar liste */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 h-fit">
            <p className="text-xs text-neutral-500 uppercase tracking-wide px-2 mb-2">Versions</p>
            <ul className="space-y-1">
              {versions.map(v => {
                const isCurrent = v.versionNum === cvMeta?.currentVersion
                const isActive  = v.versionNum === selected?.versionNum
                return (
                  <li key={v.id}>
                    <button
                      onClick={() => { setRestoreStatus('idle'); loadVersionDetail(v.versionNum) }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition text-sm ${
                        isActive
                          ? 'bg-white text-black font-medium'
                          : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>Version {v.versionNum}</span>
                        {isCurrent && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                            isActive ? 'bg-neutral-200 text-black' : 'bg-neutral-700 text-neutral-300'
                          }`}>
                            Actuelle
                          </span>
                        )}
                      </div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-neutral-600' : 'text-neutral-500'}`}>
                        {fmtDate(v.createdAt)}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Panneau détail */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-48 text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : selected ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-semibold">Version {selected.versionNum}</h2>
                    <p className="text-sm text-neutral-400 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {fmtFull(selected.createdAt)}
                    </p>
                  </div>

                  {selected.versionNum !== cvMeta?.currentVersion && (
                    <button
                      onClick={handleRestore}
                      disabled={restoring}
                      className="flex items-center gap-2 bg-white text-black font-semibold text-sm px-4 py-2 rounded-xl hover:bg-neutral-200 disabled:opacity-50 transition shrink-0"
                    >
                      {restoring
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RotateCcw className="w-4 h-4" />}
                      Restaurer
                    </button>
                  )}
                </div>

                {restoreStatus === 'ok' && (
                  <div className="flex items-center gap-2 bg-green-950 border border-green-700 text-green-300 rounded-xl px-4 py-2.5 text-sm mb-4">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Version restaurée — nouvelle version créée en tête de liste.
                  </div>
                )}
                {restoreStatus === 'error' && (
                  <div className="flex items-center gap-2 bg-red-950 border border-red-700 text-red-300 rounded-xl px-4 py-2.5 text-sm mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Erreur lors de la restauration.
                  </div>
                )}

                <div className="border border-neutral-800 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Nom</p>
                    <p className="font-medium">{preview.name}</p>
                  </div>

                  {preview.sections.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Sections</p>
                      <div className="flex flex-wrap gap-2">
                        {preview.sections.map(s => (
                          <span key={s} className="bg-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded-lg">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.versionNum === cvMeta?.currentVersion && (
                    <p className="text-xs text-neutral-500 italic">Version actuellement active.</p>
                  )}
                </div>

                {selected.versionNum === cvMeta?.currentVersion && (
                  <div className="flex gap-3 mt-5">
                    <Link
                      href={`/cv/${id}/edit`}
                      className="flex-1 text-center bg-white text-black font-semibold text-sm py-3 rounded-xl hover:bg-neutral-200 transition"
                    >
                      Modifier
                    </Link>
                    <Link
                      href={`/cv/${id}`}
                      className="flex-1 text-center border border-neutral-700 text-neutral-300 font-semibold text-sm py-3 rounded-xl hover:bg-neutral-800 transition"
                    >
                      Voir le CV
                    </Link>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
