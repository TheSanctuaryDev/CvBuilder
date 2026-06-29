// apps/web/components/editor/CVEditor.tsx
'use client'

import { useReducer, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Check, Circle, Loader2, AlertTriangle, ArrowLeft,
  Download, ChevronUp, ChevronDown, Palette,
  Undo2, Redo2, ZoomIn, ZoomOut,
} from 'lucide-react'
import { editorReducer } from '@/lib/editor-reducer'
import { rawDataToSections } from '@/lib/cv-sections'
import CVPreview from './CVPreview'
import SectionPanel from './SectionPanel'
import type { EditorState, CvSection, HeaderSection, SummarySection, ExperienceSection, FormationSection, SkillsSection } from '@/types/editor'
import { DEFAULT_TOKENS, parseTokens, type StyleTokens } from '@/components/templates/registry'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
const ZOOM_LEVELS = [0.5, 0.65, 0.75, 0.85, 1.0]

interface CVEditorProps {
  cvId: string
  templateKey: string
  styleTokens?: StyleTokens
  title: string
}

interface TemplateOption {
  id: string
  name: string
  templateKey: string
  isPremium: boolean
  styleTokens: string
}

async function getAuthHeader(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session ? `Bearer ${session.access_token}` : ''
}

// ─── Completeness score ────────────────────────────────────────────────────

function computeScore(sections: CvSection[]): { score: number; label: string; color: string } {
  const byType = Object.fromEntries(sections.map(s => [s.type, s]))
  let pts = 0; let total = 0

  const header = byType['header'] as HeaderSection | undefined
  total += 30
  if (header?.fullName?.trim()) pts += 10
  if (header?.jobTitle?.trim()) pts += 10
  if (header?.emails?.some(e => e.trim())) pts += 10

  const summary = byType['summary'] as SummarySection | undefined
  total += 20
  if ((summary?.text?.trim()?.length ?? 0) >= 80) pts += 20
  else if ((summary?.text?.trim()?.length ?? 0) > 0) pts += 10

  const exp = byType['experience'] as ExperienceSection | undefined
  total += 20
  if ((exp?.entries?.length ?? 0) >= 2) pts += 20
  else if ((exp?.entries?.length ?? 0) === 1) pts += 10

  const form = byType['formation'] as FormationSection | undefined
  total += 15
  if ((form?.entries?.length ?? 0) >= 1) pts += 15

  const skills = byType['skills'] as SkillsSection | undefined
  total += 15
  if ((skills?.items?.length ?? 0) >= 4) pts += 15
  else if ((skills?.items?.length ?? 0) > 0) pts += 8

  const pct = Math.round((pts / total) * 100)
  const label = pct >= 90 ? 'Excellent' : pct >= 70 ? 'Bien' : pct >= 40 ? 'Incomplet' : 'Vide'
  const color = pct >= 90 ? 'text-emerald-400' : pct >= 70 ? 'text-blue-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'
  return { score: pct, label, color }
}

export default function CVEditor({ cvId, templateKey: initialTemplateKey, styleTokens: initialTokens = DEFAULT_TOKENS, title }: CVEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved')
  const [mobileTab, setMobileTab] = useState<'preview' | 'edit'>('preview')
  const [mobileSectionList, setMobileSectionList] = useState(false)
  const [currentTemplateKey, setCurrentTemplateKey] = useState(initialTemplateKey)
  const [currentStyleTokens, setCurrentStyleTokens] = useState<StyleTokens>(initialTokens)
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [zoomIdx, setZoomIdx] = useState(3) // 0.85 par défaut
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const zoom = ZOOM_LEVELS[zoomIdx]

  const [state, dispatch] = useReducer(editorReducer, {
    cvId,
    templateKey: initialTemplateKey,
    sections: [],
    activeSectionId: null,
    isDirty: false,
    past: [],
    future: [],
  } satisfies EditorState)

  const sectionsRef = useRef(state.sections)
  const styleTokensRef = useRef(currentStyleTokens)
  useEffect(() => { sectionsRef.current = state.sections }, [state.sections])
  useEffect(() => { styleTokensRef.current = currentStyleTokens }, [currentStyleTokens])

  // Chargement initial des sections + style tokens
  useEffect(() => {
    async function load() {
      try {
        const auth = await getAuthHeader()
        const res = await fetch(`${API_URL}/api/cvs/${cvId}`, {
          headers: { Authorization: auth },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('CV non trouvé')
        const cv = await res.json()
        const raw = cv.cvData ?? null
        const sections = rawDataToSections(raw)
        dispatch({ type: 'INIT_SECTIONS', sections })
        // Restaure les style tokens persistés (stockés dans cv_data._styleTokens)
        if (raw?._styleTokens && typeof raw._styleTokens === 'object') {
          setCurrentStyleTokens({ ...DEFAULT_TOKENS, ...raw._styleTokens })
        }
      } catch {
        // sections vides — l'utilisateur commence de zéro
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [cvId])

  // Chargement des templates disponibles
  useEffect(() => {
    fetch(`${API_URL}/api/templates`)
      .then(r => r.ok ? r.json() : [])
      .then((data: TemplateOption[]) => setTemplates(data))
      .catch(() => {})
  }, [])

  // Auto-save debounce 2s — stocke sections + styleTokens directement
  useEffect(() => {
    if (!state.isDirty) return
    setSaveStatus('dirty')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const auth = await getAuthHeader()
        await fetch(`${API_URL}/api/cvs/${cvId}`, {
          method: 'PATCH',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cvData: {
              sections: sectionsRef.current,
              _styleTokens: styleTokensRef.current,
            },
          }),
        })
        dispatch({ type: 'MARK_SAVED' })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [state.isDirty, cvId])

  // Force-save immédiat
  const forceSave = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('saving')
    try {
      const auth = await getAuthHeader()
      await fetch(`${API_URL}/api/cvs/${cvId}`, {
        method: 'PATCH',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: {
            sections: sectionsRef.current,
            _styleTokens: styleTokensRef.current,
          },
        }),
      })
      dispatch({ type: 'MARK_SAVED' })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [cvId])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) {
        if (e.key === 'Escape') dispatch({ type: 'SET_ACTIVE', id: null })
        return
      }
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault()
          if (e.shiftKey) dispatch({ type: 'REDO' })
          else dispatch({ type: 'UNDO' })
          break
        case 'y':
          e.preventDefault()
          dispatch({ type: 'REDO' })
          break
        case 's':
          e.preventDefault()
          forceSave()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [forceSave])

  // ── Gestion changement de style tokens (déclenche auto-save) ──────────
  const handleStyleChange = useCallback((tokens: StyleTokens) => {
    setCurrentStyleTokens(tokens)
    // Marque dirty pour déclencher l'auto-save via le useEffect isDirty
    // On pirate le système en dispatchant un UPDATE_SECTION fictif si sections non vides,
    // sinon on force save directement
    if (sectionsRef.current.length > 0) {
      // Ré-dispatch la première section inchangée pour marquer dirty
      setSaveStatus('dirty')
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setSaveStatus('saving')
        try {
          const auth = await getAuthHeader()
          await fetch(`${API_URL}/api/cvs/${cvId}`, {
            method: 'PATCH',
            headers: { Authorization: auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cvData: {
                sections: sectionsRef.current,
                _styleTokens: tokens,
              },
            }),
          })
          setSaveStatus('saved')
        } catch {
          setSaveStatus('error')
        }
      }, 2000)
    }
  }, [cvId])

  const switchTemplate = useCallback(async (tmpl: TemplateOption) => {
    setCurrentTemplateKey(tmpl.templateKey)
    setCurrentStyleTokens(parseTokens(tmpl.styleTokens))
    setShowTemplatePicker(false)
    try {
      const auth = await getAuthHeader()
      await fetch(`${API_URL}/api/cvs/${cvId}`, {
        method: 'PATCH',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey: tmpl.templateKey }),
      })
    } catch { /* non bloquant */ }
  }, [cvId])

  async function exportPdf() {
    const auth = await getAuthHeader()
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvId, sections: state.sections, templateKey: currentTemplateKey, styleTokens: currentStyleTokens }),
    })
    if (!res.ok) return alert('Erreur export PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  async function exportDocx() {
    const auth = await getAuthHeader()
    const res = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: state.sections, templateKey: currentTemplateKey, styleTokens: currentStyleTokens }),
    })
    if (!res.ok) return alert('Erreur export Word')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.docx`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        Chargement de l&apos;éditeur…
      </div>
    )
  }

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0
  const { score, label: scoreLabel, color: scoreColor } = computeScore(state.sections)

  const saveIndicator = {
    saved:  { icon: <Check className="w-3.5 h-3.5" />,               label: 'Sauvegardé',                    color: 'text-neutral-500' },
    dirty:  { icon: <Circle className="w-2.5 h-2.5 fill-current" />,  label: 'Non sauvegardé', color: 'text-neutral-300' },
    saving: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: 'Sauvegarde…',                   color: 'text-neutral-400' },
    error:  { icon: <AlertTriangle className="w-3.5 h-3.5" />,        label: 'Erreur',           color: 'text-red-400' },
  }[saveStatus]

  const currentTemplateName = templates.find(t => t.templateKey === currentTemplateKey)?.name ?? currentTemplateKey

  const SECTION_LABELS: Record<string, string> = {
    header: 'Informations', summary: 'Profil', experience: 'Expériences',
    formation: 'Formation', skills: 'Compétences', languages: 'Langues',
    interests: 'Intérêts', references: 'Références',
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950 shrink-0 gap-2">
        <button
          onClick={() => router.push(`/cv/${cvId}`)}
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-sm transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Retour</span>
        </button>

        {/* Groupe gauche: undo/redo + template */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 transition rounded-lg hover:bg-neutral-800"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'REDO' })}
            disabled={!canRedo}
            title="Rétablir (Ctrl+Y)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 transition rounded-lg hover:bg-neutral-800"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Template switcher */}
          <div className="relative hidden sm:block ml-1">
            <button
              onClick={() => setShowTemplatePicker(v => !v)}
              className="flex items-center gap-1.5 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="capitalize max-w-20 truncate">{currentTemplateName}</span>
            </button>

            {showTemplatePicker && templates.length > 0 && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl overflow-hidden min-w-48">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => switchTemplate(t)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between gap-2
                      ${t.templateKey === currentTemplateKey
                        ? 'bg-white text-black font-semibold'
                        : 'text-neutral-200 hover:bg-neutral-800'
                      }`}
                  >
                    <span>{t.name}</span>
                    {t.isPremium && <span className="text-xs text-amber-400">PRO</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Centre: completeness + save status */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${scoreColor}`}>{score}% · {scoreLabel}</span>
          </div>
          <span className={`flex items-center gap-1.5 text-xs ${saveIndicator.color} hidden sm:flex`}>
            {saveIndicator.icon} {saveIndicator.label}
          </span>
        </div>

        {/* Zoom + export */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom controls (desktop seulement) */}
          <div className="hidden lg:flex items-center gap-1 border border-neutral-800 rounded-lg px-1 py-0.5">
            <button
              onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
              title="Dézoomer"
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-neutral-500 w-10 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_LEVELS.length - 1}
              title="Zoomer"
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 text-sm bg-white text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={exportDocx}
            className="flex items-center gap-1.5 text-sm border border-neutral-700 text-white px-3 py-1.5 rounded-lg hover:border-neutral-500 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Word</span>
          </button>
        </div>
      </div>

      {/* ── Onglets tablet ───────────────────────────────────────────── */}
      <div className="hidden sm:flex lg:hidden border-b border-neutral-800 bg-neutral-950 shrink-0">
        <button
          onClick={() => setMobileTab('preview')}
          className={`px-6 py-2 text-sm transition ${mobileTab === 'preview' ? 'text-white border-b-2 border-white' : 'text-neutral-400'}`}
        >
          Aperçu
        </button>
        <button
          onClick={() => setMobileTab('edit')}
          className={`px-6 py-2 text-sm transition ${mobileTab === 'edit' ? 'text-white border-b-2 border-white' : 'text-neutral-400'}`}
        >
          Édition
        </button>
      </div>

      {/* ── Desktop (≥1024px) ────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div
          className="flex-1 overflow-auto bg-neutral-200 flex justify-center items-start"
          onClick={() => { setShowTemplatePicker(false) }}
          style={{ padding: '2rem' }}
        >
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <CVPreview
              sections={state.sections}
              activeSectionId={state.activeSectionId}
              dispatch={dispatch}
              templateKey={currentTemplateKey}
              styleTokens={currentStyleTokens}
            />
          </div>
        </div>
        <div className="w-96 border-l border-neutral-800 bg-neutral-950 overflow-y-auto">
          <SectionPanel
            sections={state.sections}
            activeSectionId={state.activeSectionId}
            dispatch={dispatch}
            styleTokens={currentStyleTokens}
            onStyleChange={handleStyleChange}
          />
        </div>
      </div>

      {/* ── Tablet (sm–lg) ───────────────────────────────────────────── */}
      <div className="hidden sm:flex lg:hidden flex-1 overflow-hidden">
        {mobileTab === 'preview' ? (
          <div className="flex-1 overflow-auto bg-neutral-200 p-4 flex justify-center">
            <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center', width: 794 }}>
              <CVPreview
                sections={state.sections}
                activeSectionId={state.activeSectionId}
                templateKey={currentTemplateKey}
                styleTokens={currentStyleTokens}
                dispatch={(action) => {
                  dispatch(action)
                  if (action.type === 'SET_ACTIVE') setMobileTab('edit')
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-neutral-950">
            <SectionPanel
              sections={state.sections}
              activeSectionId={state.activeSectionId}
              dispatch={dispatch}
              styleTokens={currentStyleTokens}
              onStyleChange={handleStyleChange}
            />
          </div>
        )}
      </div>

      {/* ── Mobile (<sm) ─────────────────────────────────────────────── */}
      <div className="flex sm:hidden flex-col flex-1 overflow-hidden">
        <div className="overflow-hidden bg-neutral-200 shrink-0" style={{ height: 320 }}>
          <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: 794, pointerEvents: 'none' }}>
            <CVPreview
              sections={state.sections}
              activeSectionId={null}
              dispatch={() => {}}
              templateKey={currentTemplateKey}
              styleTokens={currentStyleTokens}
              isDragDisabled
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-neutral-950 p-4">
          <p className="text-xs text-neutral-500 mb-3">Sections — tap pour éditer</p>
          {[...state.sections].sort((a, b) => a.order - b.order).map((section, idx, arr) => (
            <div key={section.id} className="flex items-center gap-2 mb-2">
              <button
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE', id: section.id })
                  setMobileSectionList(true)
                }}
                className={`flex-1 text-left bg-neutral-900 border rounded-lg px-4 py-2.5 text-sm transition
                  ${section.hidden ? 'text-neutral-600 border-neutral-900' : 'text-white border-neutral-800 hover:border-neutral-600'}`}
              >
                {SECTION_LABELS[section.type] ?? section.type}
                {section.hidden && <span className="ml-2 text-xs text-neutral-600">(masqué)</span>}
              </button>
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => {
                    const ids = arr.map(s => s.id)
                    ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
                    dispatch({ type: 'REORDER', ids })
                  }}
                  className="text-neutral-400 hover:text-white disabled:opacity-30 transition px-1"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  disabled={idx === arr.length - 1}
                  onClick={() => {
                    const ids = arr.map(s => s.id)
                    ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
                    dispatch({ type: 'REORDER', ids })
                  }}
                  className="text-neutral-400 hover:text-white disabled:opacity-30 transition px-1"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {mobileSectionList && state.activeSectionId && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="flex-1 bg-black/60" onClick={() => setMobileSectionList(false)} />
            <div className="bg-neutral-950 rounded-t-2xl border-t border-neutral-800 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>
              <SectionPanel
                sections={state.sections}
                activeSectionId={state.activeSectionId}
                dispatch={(action) => {
                  dispatch(action)
                  if (action.type === 'SET_ACTIVE' && action.id === null) setMobileSectionList(false)
                }}
                styleTokens={currentStyleTokens}
                onStyleChange={handleStyleChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
