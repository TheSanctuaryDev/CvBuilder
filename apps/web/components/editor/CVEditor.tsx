// apps/web/components/editor/CVEditor.tsx
'use client'

import { useReducer, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { editorReducer } from '@/lib/editor-reducer'
import { cvDataToSections, sectionsToCvData } from '@/lib/cv-sections'
import CVPreview from './CVPreview'
import SectionPanel from './SectionPanel'
import type { CvData } from '@/types'
import type { EditorState } from '@/types/editor'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

interface CVEditorProps {
  cvId: string
  templateKey: string
  title: string
}

async function getAuthHeader(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session ? `Bearer ${session.access_token}` : ''
}

export default function CVEditor({ cvId, templateKey, title }: CVEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved')
  const [mobileTab, setMobileTab] = useState<'preview' | 'edit'>('preview')
  const [mobileSectionList, setMobileSectionList] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [state, dispatch] = useReducer(editorReducer, {
    cvId,
    templateKey,
    sections: [],
    activeSectionId: null,
    isDirty: false,
  } satisfies EditorState)

  // Chargement initial
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
        const cvData: CvData = cv.cvData ?? {
          fullName: cv.title ?? 'Mon CV',
          fieldOfActivity: '',
        }
        const sections = cvDataToSections(cvData)
        dispatch({ type: 'INIT_SECTIONS', sections })
      } catch {
        // sections vides, l'utilisateur commence de zéro
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [cvId])

  // Auto-save debounce 2s
  useEffect(() => {
    if (!state.isDirty) return
    setSaveStatus('dirty')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const auth = await getAuthHeader()
        const cvData = sectionsToCvData(state.sections)
        await fetch(`${API_URL}/api/cvs/${cvId}`, {
          method: 'PATCH',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cvData }),
        })
        dispatch({ type: 'MARK_SAVED' })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [state.isDirty, state.sections, cvId])

  async function exportPdf() {
    const auth = await getAuthHeader()
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvId, sections: state.sections, templateKey }),
    })
    if (!res.ok) return alert('Erreur export PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportDocx() {
    const res = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: state.sections }),
    })
    if (!res.ok) return alert('Erreur export Word')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        Chargement de l&apos;éditeur…
      </div>
    )
  }

  const saveLabel = {
    saved: '✓ Sauvegardé',
    dirty: '● Modifications non sauvegardées',
    saving: '↑ Sauvegarde…',
    error: '⚠ Erreur de sauvegarde',
  }[saveStatus]

  const saveColor = {
    saved: 'text-neutral-500',
    dirty: 'text-neutral-300',
    saving: 'text-neutral-400',
    error: 'text-red-400',
  }[saveStatus]

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950 shrink-0">
        <button
          onClick={() => router.push(`/cv/${cvId}`)}
          className="text-neutral-400 hover:text-white text-sm transition"
        >
          ← Retour
        </button>
        <span className={`text-xs ${saveColor} hidden sm:inline`}>{saveLabel}</span>
        <div className="flex gap-2">
          <button
            onClick={exportPdf}
            className="text-sm bg-white text-black font-semibold px-4 py-1.5 rounded-lg hover:bg-neutral-200 transition"
          >
            ↓ PDF
          </button>
          <button
            onClick={exportDocx}
            className="text-sm border border-neutral-700 text-white px-4 py-1.5 rounded-lg hover:border-neutral-500 transition"
          >
            ↓ Word
          </button>
        </div>
      </div>

      {/* Onglets tablet */}
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

      {/* Layout Desktop (≥1024px) */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Preview A4 */}
        <div className="flex-1 overflow-auto bg-neutral-100 p-8">
          <CVPreview
            sections={state.sections}
            activeSectionId={state.activeSectionId}
            dispatch={dispatch}
          />
        </div>
        {/* Panneau latéral */}
        <div className="w-96 border-l border-neutral-800 bg-neutral-950 overflow-y-auto">
          <SectionPanel
            sections={state.sections}
            activeSectionId={state.activeSectionId}
            dispatch={dispatch}
          />
        </div>
      </div>

      {/* Layout Tablet (sm–lg) */}
      <div className="hidden sm:flex lg:hidden flex-1 overflow-hidden">
        {mobileTab === 'preview' ? (
          <div className="flex-1 overflow-auto bg-neutral-100 p-4 flex justify-center">
            <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center', width: 794 }}>
              <CVPreview
                sections={state.sections}
                activeSectionId={state.activeSectionId}
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
            />
          </div>
        )}
      </div>

      {/* Layout Mobile (<sm) */}
      <div className="flex sm:hidden flex-col flex-1 overflow-hidden">
        {/* Preview zoomée lecture seule */}
        <div className="overflow-hidden bg-neutral-100 shrink-0" style={{ height: 320 }}>
          <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: 794, pointerEvents: 'none' }}>
            <CVPreview
              sections={state.sections}
              activeSectionId={null}
              dispatch={() => {}}
              isDragDisabled
            />
          </div>
        </div>
        {/* Liste des sections avec boutons ↑ ↓ */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 p-4">
          <p className="text-xs text-neutral-500 mb-3">Sections — tap pour éditer</p>
          {[...state.sections].sort((a, b) => a.order - b.order).map((section, idx, arr) => (
            <div key={section.id} className="flex items-center gap-2 mb-2">
              <button
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE', id: section.id })
                  setMobileSectionList(true)
                }}
                className="flex-1 text-left bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white hover:border-neutral-600 transition capitalize"
              >
                {section.type}
              </button>
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => {
                    const ids = arr.map(s => s.id)
                    ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
                    dispatch({ type: 'REORDER', ids })
                  }}
                  className="text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition px-1"
                >
                  ↑
                </button>
                <button
                  disabled={idx === arr.length - 1}
                  onClick={() => {
                    const ids = arr.map(s => s.id)
                    ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
                    dispatch({ type: 'REORDER', ids })
                  }}
                  className="text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition px-1"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Bottom drawer mobile */}
        {mobileSectionList && state.activeSectionId && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="bg-black/60" onClick={() => setMobileSectionList(false)} />
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
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
