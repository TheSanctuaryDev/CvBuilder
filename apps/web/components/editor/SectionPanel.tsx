// apps/web/components/editor/SectionPanel.tsx
'use client'

import { useState, useRef } from 'react'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/client'
import {
  MousePointerClick, X, Plus, Briefcase,
  GraduationCap, Star, Globe, Heart, Users, FileText,
  Eye, EyeOff, Copy, Sparkles, Loader2, Camera, Trash2,
  Palette, AlignLeft, AlignCenter, AlignRight, LayoutTemplate,
} from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import RichTextEditor from './RichTextEditor'
import type {
  CvSection, EditorAction, ExperienceEntry, ExperienceSection,
  FormationEntry, FormationSection, HeaderSection, SectionType,
  CustomSection,
} from '@/types/editor'
import type { StyleTokens } from '@/components/templates/registry'
import type { PhoneEntry } from '@/types'
import { COUNTRY_CODES } from '@/lib/country-codes'

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await createClient().auth.getSession()
  return session ? `Bearer ${session.access_token}` : ''
}

// ─── helpers ────────────────────────────────────────────────────────────────

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isValidPhone = (v: string) => /^[\d\s\-]{4,15}$/.test(v)
const LANG_LEVELS = ['Natif', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1']

function parseLang(s: string): { name: string; level: string } {
  const m = s.match(/^(.+?)\s*\((.+?)\)$/)
  return m ? { name: m[1].trim(), level: m[2].trim() } : { name: s, level: '' }
}
const fmtLang = (name: string, level: string) => (level ? `${name} (${level})` : name)

async function compressPhoto(file: File, maxPx = 220): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = img.width  * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── catalog ─────────────────────────────────────────────────────────────────

const CATALOG: {
  type: SectionType
  label: string
  Icon: React.FC<{ className?: string }>
  desc: string
  multi?: boolean
}[] = [
  { type: 'summary',    label: 'Profil',           Icon: FileText,      desc: 'Accroche / pitch' },
  { type: 'experience', label: 'Expériences',       Icon: Briefcase,     desc: 'Postes occupés' },
  { type: 'formation',  label: 'Formation',         Icon: GraduationCap, desc: 'Diplômes & études' },
  { type: 'skills',     label: 'Compétences',       Icon: Star,          desc: 'Savoir-faire' },
  { type: 'languages',  label: 'Langues',           Icon: Globe,         desc: 'Langues parlées' },
  { type: 'interests',  label: 'Intérêts',          Icon: Heart,         desc: "Centres d'intérêt" },
  { type: 'references', label: 'Références',        Icon: Users,         desc: 'Recommandations' },
  { type: 'custom',     label: 'Section libre',     Icon: LayoutTemplate, desc: 'Titre + contenu personnalisé', multi: true },
]

function makeEmptySection(type: SectionType, order: number): CvSection {
  const id = nanoid()
  switch (type) {
    case 'summary':    return { id, type, order, text: '', textAlign: 'left' }
    case 'experience': return { id, type, order, entries: [] }
    case 'formation':  return { id, type, order, entries: [] }
    case 'skills':     return { id, type, order, items: [] }
    case 'languages':  return { id, type, order, items: [] }
    case 'interests':  return { id, type, order, items: [] }
    case 'references': return { id, type, order, items: [] }
    case 'custom':     return { id, type, order, title: '', content: '', textAlign: 'left' }
    default:           return { id, type: 'summary', order, text: '' }
  }
}

// ─── shared UI atoms ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

const cls = {
  input:    'w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white',
  inputSm:  'w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white',
}

const SECTION_LABELS: Record<string, string> = {
  header: 'Informations', summary: 'Profil', experience: 'Expériences',
  formation: 'Formation', skills: 'Compétences', languages: 'Langues',
  interests: 'Intérêts', references: 'Références', custom: 'Section libre',
}

function AlignButtons({ value, onChange }: { value?: string; onChange: (v: 'left' | 'center' | 'right') => void }) {
  const opts: { v: 'left' | 'center' | 'right'; Icon: React.FC<{ className?: string }> }[] = [
    { v: 'left',   Icon: AlignLeft },
    { v: 'center', Icon: AlignCenter },
    { v: 'right',  Icon: AlignRight },
  ]
  return (
    <div className="flex gap-1">
      {opts.map(({ v, Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`p-1.5 rounded-lg transition ${
            (value ?? 'left') === v
              ? 'bg-white text-black'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

interface Props {
  sections: CvSection[]
  activeSectionId: string | null
  dispatch: React.Dispatch<EditorAction>
  styleTokens: StyleTokens
  onStyleChange: (tokens: StyleTokens) => void
}

export default function SectionPanel({ sections, activeSectionId, dispatch, styleTokens, onStyleChange }: Props) {
  const section = sections.find(s => s.id === activeSectionId)
  const [noSectionTab, setNoSectionTab] = useState<'sections' | 'style'>('sections')

  // ── pas de section active ─────────────────────────────────────────────────
  if (!section) {
    const existingTypes = new Set(sections.map(s => s.type))
    const available = CATALOG.filter(c => c.multi || !existingTypes.has(c.type))
    const maxOrder  = Math.max(...sections.map(s => s.order), -1)

    return (
      <div className="flex flex-col h-full">
        <div className="flex border-b border-neutral-800 shrink-0">
          {(['sections', 'style'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setNoSectionTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition flex items-center justify-center gap-1.5
                ${noSectionTab === tab ? 'text-white border-b-2 border-white' : 'text-neutral-500'}`}
            >
              {tab === 'sections' ? <MousePointerClick className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
              {tab === 'sections' ? 'Sections' : 'Style'}
            </button>
          ))}
        </div>

        {noSectionTab === 'sections' ? (
          <div className="flex-1 overflow-y-auto p-5">
            <p className="text-xs text-neutral-600 mb-4">
              Cliquez sur une section du CV pour l&apos;éditer, ou ajoutez-en une :
            </p>
            {available.length > 0 ? (
              <div className="grid gap-2">
                {available.map(({ type, label, Icon, desc }) => (
                  <button
                    key={type}
                    onClick={() => dispatch({ type: 'ADD_SECTION', section: makeEmptySection(type, maxOrder + 1) })}
                    className="flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 rounded-xl p-3 text-left transition group"
                  >
                    <div className="w-8 h-8 bg-neutral-800 group-hover:bg-neutral-700 rounded-lg flex items-center justify-center shrink-0 transition">
                      <Icon className="w-4 h-4 text-neutral-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{label}</p>
                      <p className="text-xs text-neutral-500">{desc}</p>
                    </div>
                    <Plus className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-600">Toutes les sections sont présentes.</p>
            )}

            {sections.filter(s => s.hidden).length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-neutral-500 mb-2">Sections masquées</p>
                {sections.filter(s => s.hidden).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 px-3 bg-neutral-900/50 rounded-lg mb-1">
                    <span className="text-xs text-neutral-500">{SECTION_LABELS[s.type] ?? s.type}</span>
                    <button onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY', id: s.id })} className="text-neutral-500 hover:text-white transition">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <StylePanel tokens={styleTokens} onChange={onStyleChange} />
        )}
      </div>
    )
  }

  function handleDelete() {
    if (!confirm('Supprimer cette section ?')) return
    dispatch({ type: 'DELETE_SECTION', id: section!.id })
  }

  const isHidden = !!section.hidden

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-5 flex-1 min-h-0">
        {/* Header section panel */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-sm">{SECTION_LABELS[section.type] ?? section.type}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY', id: section!.id })}
              title={isHidden ? 'Afficher' : 'Masquer'}
              className="p-1.5 text-neutral-500 hover:text-white rounded-lg transition"
            >
              {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE', id: null })}
              className="p-1.5 text-neutral-500 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isHidden && (
          <div className="mb-4 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-500">
            Section masquée — n&apos;apparaît pas dans l&apos;aperçu ni dans l&apos;export.
          </div>
        )}

        {section.type === 'header'     && <HeaderForm     section={section as HeaderSection}     dispatch={dispatch} />}
        {section.type === 'summary'    && <SummaryForm    section={section as Extract<CvSection, { type: 'summary' }>} dispatch={dispatch} />}
        {section.type === 'experience' && <ExperienceForm section={section as ExperienceSection} dispatch={dispatch} />}
        {section.type === 'formation'  && <FormationForm  section={section as FormationSection}  dispatch={dispatch} />}
        {section.type === 'skills' && (
          <SkillsForm items={section.items} onChange={items =>
            dispatch({ type: 'UPDATE_SECTION', section: { ...section, items } as CvSection })
          } />
        )}
        {section.type === 'languages' && (
          <LanguagesForm items={section.items} onChange={items =>
            dispatch({ type: 'UPDATE_SECTION', section: { ...section, items } as CvSection })
          } />
        )}
        {(section.type === 'interests' || section.type === 'references') && (
          <ListForm
            items={section.items}
            placeholder={section.type === 'interests' ? 'ex: Randonnée, Photographie…' : 'Prénom Nom · Poste · Contact…'}
            onChange={items =>
              dispatch({ type: 'UPDATE_SECTION', section: { ...section, items } as CvSection })
            }
          />
        )}
        {section.type === 'custom' && <CustomForm section={section as CustomSection} dispatch={dispatch} />}
      </div>

      {section.type !== 'header' && (
        <div className="p-5 border-t border-neutral-800 shrink-0">
          <button onClick={handleDelete} className="w-full text-center text-xs text-neutral-600 hover:text-red-400 transition py-1">
            Supprimer cette section
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Style panel ──────────────────────────────────────────────────────────────

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 w-full text-sm text-white hover:border-neutral-500 transition"
      >
        <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ background: value }} />
        <span className="font-mono text-xs">{value.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-xl">
          <HexColorPicker color={value} onChange={onChange} />
          <input
            type="text"
            value={value}
            onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
            className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white"
          />
          <button onClick={() => setOpen(false)} className="mt-2 w-full text-xs text-neutral-500 hover:text-white transition">Fermer</button>
        </div>
      )}
    </div>
  )
}

function StylePanel({ tokens, onChange }: { tokens: StyleTokens; onChange: (t: StyleTokens) => void }) {
  const up = (patch: Partial<StyleTokens>) => onChange({ ...tokens, ...patch })
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div>
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Police</p>
        <div className="flex gap-2">
          {(['serif', 'sans-serif'] as const).map(f => (
            <button key={f} onClick={() => up({ fontFamily: f })}
              className={`flex-1 py-2 text-sm rounded-lg border transition ${tokens.fontFamily === f ? 'border-white text-white bg-white/10' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
              style={{ fontFamily: f === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif' }}>
              {f === 'serif' ? 'Serif' : 'Sans-serif'}
            </button>
          ))}
        </div>
      </div>
      <ColorField label="Couleur du nom"        value={tokens.nameColor}    onChange={v => up({ nameColor: v })} />
      <ColorField label="Couleur d'accent"       value={tokens.accentColor}  onChange={v => up({ accentColor: v })} />
      <ColorField label="Couleur du séparateur"  value={tokens.dividerColor} onChange={v => up({ dividerColor: v })} />
      <div>
        <p className="text-xs text-neutral-400 mb-2">Épaisseur du séparateur</p>
        <div className="flex gap-2">
          {(['1', '2'] as const).map(w => (
            <button key={w} onClick={() => up({ dividerWidth: w })}
              className={`flex-1 py-2 text-sm rounded-lg border transition ${tokens.dividerWidth === w ? 'border-white text-white bg-white/10' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}>
              {w}px
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-neutral-400 mb-2">Palettes prêtes</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'Classique', nameColor: '#111111', accentColor: '#6b7280', dividerColor: '#d1d5db' },
            { name: 'Marine',    nameColor: '#1e3a5f', accentColor: '#2563eb', dividerColor: '#bfdbfe' },
            { name: 'Forêt',     nameColor: '#14532d', accentColor: '#16a34a', dividerColor: '#bbf7d0' },
            { name: 'Bordeaux',  nameColor: '#4c0519', accentColor: '#be123c', dividerColor: '#fecdd3' },
          ].map(p => (
            <button key={p.name} onClick={() => up({ nameColor: p.nameColor, accentColor: p.accentColor, dividerColor: p.dividerColor })}
              title={p.name}
              className="aspect-square rounded-xl border border-neutral-700 hover:border-neutral-400 transition overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${p.nameColor} 50%, ${p.accentColor} 50%)` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── sous-formulaires ─────────────────────────────────────────────────────────

function HeaderForm({ section, dispatch }: { section: HeaderSection; dispatch: React.Dispatch<EditorAction> }) {
  const fileRef   = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const emails = section.emails?.length ? section.emails : ['']
  const phones = section.phones?.length ? section.phones : [{ indicatif: '+229', number: '' }]
  const photoSize     = section.photoSize     ?? 80
  const photoPosition = section.photoPosition ?? 'right'
  const photoShape    = section.photoShape    ?? 'circle'

  const update = (patch: Partial<HeaderSection>) =>
    dispatch({ type: 'UPDATE_SECTION', section: { ...section, ...patch } })

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try { update({ photoBase64: await compressPhoto(file) }) }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Photo */}
      <div>
        <label className="block text-xs text-neutral-400 mb-2">Photo de profil</label>
        <div className="flex items-start gap-3">
          <div
            className="bg-neutral-800 border-2 border-dashed border-neutral-700 flex items-center justify-center overflow-hidden shrink-0"
            style={{
              width:        photoSize * 0.6,
              height:       photoSize * 0.6,
              borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '8px' : '0px',
            }}
          >
            {section.photoBase64
              ? <img src={section.photoBase64} alt="" className="w-full h-full object-cover" />
              : <Camera className="w-5 h-5 text-neutral-600" />
            }
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-3 py-1.5 rounded-lg transition"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              {uploading ? 'Compression…' : 'Choisir une photo'}
            </button>
            {section.photoBase64 && (
              <button onClick={() => update({ photoBase64: undefined })} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 transition">
                <Trash2 className="w-3 h-3" /> Supprimer
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        {section.photoBase64 && (
          <div className="mt-3 space-y-3">
            {/* Taille */}
            <Field label={`Taille : ${photoSize}px`}>
              <input
                type="range" min={50} max={180} step={5} value={photoSize}
                onChange={e => update({ photoSize: Number(e.target.value) })}
                className="w-full accent-white"
              />
            </Field>

            {/* Position */}
            <Field label="Position">
              <div className="flex gap-2">
                {([['left', 'Gauche'], ['right', 'Droite']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => update({ photoPosition: v })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition ${photoPosition === v ? 'border-white text-white bg-white/10' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>

            {/* Forme */}
            <Field label="Forme">
              <div className="flex gap-2">
                {([['circle', 'Cercle'], ['rounded', 'Arrondi'], ['square', 'Carré']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => update({ photoShape: v })}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition ${photoShape === v ? 'border-white text-white bg-white/10' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </div>

      {/* Champs texte */}
      <div className="space-y-3">
        {([
          { label: 'Nom complet *', field: 'fullName',  placeholder: 'Jean Martin' },
          { label: 'Titre professionnel', field: 'jobTitle', placeholder: 'Développeur Full Stack' },
          { label: 'Adresse',             field: 'address',  placeholder: 'Paris, France' },
          { label: 'LinkedIn',            field: 'linkedIn', placeholder: 'linkedin.com/in/jean-martin' },
          { label: 'GitHub',              field: 'gitHub',   placeholder: 'github.com/jeanmartin' },
        ] as { label: string; field: keyof HeaderSection; placeholder: string }[]).map(({ label, field, placeholder }) => (
          <Field key={String(field)} label={label}>
            <input
              type="text"
              value={(section[field] as string) ?? ''}
              onChange={e => update({ [field]: e.target.value })}
              placeholder={placeholder}
              className={cls.input}
            />
          </Field>
        ))}

        {/* Emails */}
        <Field label="Email">
          <div className="space-y-1.5">
            {emails.map((email, i) => {
              const invalid = email.length > 0 && !isValidEmail(email)
              return (
                <div key={i} className="flex gap-1.5">
                  <input type="email" value={email}
                    onChange={e => { const n = [...emails]; n[i] = e.target.value; update({ emails: n }) }}
                    placeholder="jean@exemple.com"
                    className={`flex-1 bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white ${invalid ? 'border-red-500' : 'border-neutral-700'}`} />
                  {emails.length > 1 && (
                    <button onClick={() => update({ emails: emails.filter((_, j) => j !== i) })} className="text-neutral-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
                  )}
                </div>
              )
            })}
            {emails.length < 2 && (
              <button onClick={() => update({ emails: [...emails, ''] })} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            )}
          </div>
        </Field>

        {/* Téléphones */}
        <Field label="Téléphone">
          <div className="space-y-1.5">
            {phones.map((phone, i) => {
              const invalid = phone.number.length > 0 && !isValidPhone(phone.number)
              return (
                <div key={i} className="flex gap-1.5">
                  <select value={phone.indicatif}
                    onChange={e => { const n = [...phones]; n[i] = { ...n[i], indicatif: e.target.value }; update({ phones: n as PhoneEntry[] }) }}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-white [&>option]:bg-neutral-900">
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                  </select>
                  <input type="tel" value={phone.number}
                    onChange={e => { const n = [...phones]; n[i] = { ...n[i], number: e.target.value }; update({ phones: n as PhoneEntry[] }) }}
                    placeholder="97000000"
                    className={`flex-1 bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white ${invalid ? 'border-red-500' : 'border-neutral-700'}`} />
                  {phones.length > 1 && (
                    <button onClick={() => update({ phones: phones.filter((_, j) => j !== i) as PhoneEntry[] })} className="text-neutral-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
                  )}
                </div>
              )
            })}
            {phones.length < 3 && (
              <button onClick={() => update({ phones: [...phones, { indicatif: '+229', number: '' }] as PhoneEntry[] })} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            )}
          </div>
        </Field>
      </div>
    </div>
  )
}

function SummaryForm({
  section,
  dispatch,
}: {
  section: Extract<CvSection, { type: 'summary' }>
  dispatch: React.Dispatch<EditorAction>
}) {
  const [loading, setLoading] = useState(false)

  async function aiEnhance() {
    if (!section.text.trim()) return
    setLoading(true)
    try {
      const auth = await getAuthHeader()
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ text: section.text, type: 'summary' }),
      })
      if (res.ok) {
        const { enhanced } = await res.json()
        dispatch({ type: 'UPDATE_SECTION', section: { ...section, text: enhanced } })
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Alignement</span>
          <AlignButtons value={section.textAlign} onChange={v =>
            dispatch({ type: 'UPDATE_SECTION', section: { ...section, textAlign: v } })
          } />
        </div>
        <button
          onClick={aiEnhance}
          disabled={loading || !section.text.trim()}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white disabled:opacity-40 transition"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          IA
        </button>
      </div>
      <RichTextEditor
        content={section.text}
        onChange={text => dispatch({ type: 'UPDATE_SECTION', section: { ...section, text } })}
        placeholder="Décrivez votre profil en 3-5 phrases…"
        minHeight={120}
      />
    </div>
  )
}

function ExperienceForm({ section, dispatch }: { section: ExperienceSection; dispatch: React.Dispatch<EditorAction> }) {
  const [enhancing, setEnhancing] = useState<string | null>(null)

  function updateEntry(id: string, patch: Partial<ExperienceEntry>) {
    dispatch({ type: 'UPDATE_SECTION', section: { ...section, entries: section.entries.map(e => e.id === id ? { ...e, ...patch } : e) } })
  }

  async function aiEnhanceDesc(entry: ExperienceEntry) {
    if (!entry.description.trim()) return
    setEnhancing(entry.id)
    try {
      const auth = await getAuthHeader()
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ text: entry.description, type: 'experience', context: `${entry.title} at ${entry.company}` }),
      })
      if (res.ok) { const { enhanced } = await res.json(); updateEntry(entry.id, { description: enhanced }) }
    } finally { setEnhancing(null) }
  }

  function duplicateEntry(entry: ExperienceEntry) {
    dispatch({ type: 'ADD_ENTRY', sectionId: section.id, entry: { ...entry, id: nanoid(), title: entry.title + ' (copie)' } })
  }

  return (
    <div className="space-y-5">
      {section.entries.map((entry, idx) => (
        <div key={entry.id} className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-neutral-300">Expérience {idx + 1}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => duplicateEntry(entry)} title="Dupliquer" className="p-1 text-neutral-500 hover:text-white transition">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => dispatch({ type: 'DELETE_ENTRY', sectionId: section.id, entryId: entry.id })} className="p-1 text-neutral-500 hover:text-red-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Field label="Poste">
              <input type="text" value={entry.title} onChange={e => updateEntry(entry.id, { title: e.target.value })} placeholder="Développeur Senior" className={cls.inputSm} />
            </Field>
            <Field label="Entreprise">
              <input type="text" value={entry.company} onChange={e => updateEntry(entry.id, { company: e.target.value })} placeholder="TechCorp" className={cls.inputSm} />
            </Field>
            <Field label="Lieu (optionnel)">
              <input type="text" value={entry.location ?? ''} onChange={e => updateEntry(entry.id, { location: e.target.value })} placeholder="Paris, France" className={cls.inputSm} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Début">
                <input type="text" value={entry.startDate} onChange={e => updateEntry(entry.id, { startDate: e.target.value })} placeholder="Jan 2022" className={cls.inputSm} />
              </Field>
              <Field label="Fin">
                <input type="text" value={entry.currentPosition ? 'Présent' : entry.endDate}
                  onChange={e => updateEntry(entry.id, { endDate: e.target.value, currentPosition: false })}
                  placeholder="Présent" disabled={!!entry.currentPosition}
                  className={`${cls.inputSm} disabled:opacity-40 disabled:cursor-not-allowed`} />
              </Field>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div onClick={() => updateEntry(entry.id, { currentPosition: !entry.currentPosition, endDate: !entry.currentPosition ? 'Présent' : '' })}
                className="relative w-10 h-5 rounded-full cursor-pointer">
                <div className={`absolute inset-0 rounded-full transition-colors ${entry.currentPosition ? 'bg-white' : 'bg-neutral-700'}`} />
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${entry.currentPosition ? 'bg-neutral-950 translate-x-5' : 'bg-neutral-300 translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-neutral-400">En poste actuellement</span>
            </label>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-400">Description</label>
                <button onClick={() => aiEnhanceDesc(entry)} disabled={enhancing === entry.id || !entry.description.trim()}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white disabled:opacity-40 transition">
                  {enhancing === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  IA
                </button>
              </div>
              <RichTextEditor
                key={entry.id}
                content={entry.description}
                onChange={desc => updateEntry(entry.id, { description: desc })}
                placeholder="Missions, réalisations, impact…"
                minHeight={80}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => dispatch({ type: 'ADD_ENTRY', sectionId: section.id, entry: { id: nanoid(), title: '', company: '', location: '', startDate: '', endDate: '', currentPosition: false, description: '' } as ExperienceEntry })}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
      >
        <Plus className="w-4 h-4" /> Ajouter une expérience
      </button>
    </div>
  )
}

function FormationForm({ section, dispatch }: { section: FormationSection; dispatch: React.Dispatch<EditorAction> }) {
  function updateEntry(id: string, patch: Partial<FormationEntry>) {
    dispatch({ type: 'UPDATE_SECTION', section: { ...section, entries: section.entries.map(e => e.id === id ? { ...e, ...patch } : e) } })
  }
  function duplicateEntry(entry: FormationEntry) {
    dispatch({ type: 'ADD_ENTRY', sectionId: section.id, entry: { ...entry, id: nanoid(), degree: entry.degree + ' (copie)' } })
  }
  return (
    <div className="space-y-5">
      {section.entries.map((entry, idx) => (
        <div key={entry.id} className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-neutral-300">Formation {idx + 1}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => duplicateEntry(entry)} title="Dupliquer" className="p-1 text-neutral-500 hover:text-white transition"><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={() => dispatch({ type: 'DELETE_ENTRY', sectionId: section.id, entryId: entry.id })} className="p-1 text-neutral-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="space-y-2">
            <Field label="Diplôme / Titre">
              <input type="text" value={entry.degree} onChange={e => updateEntry(entry.id, { degree: e.target.value })} placeholder="Master Informatique" className={cls.inputSm} />
            </Field>
            <Field label="Établissement">
              <input type="text" value={entry.school} onChange={e => updateEntry(entry.id, { school: e.target.value })} placeholder="Université Paris-Saclay" className={cls.inputSm} />
            </Field>
            <Field label="Année / Période">
              <input type="text" value={entry.year} onChange={e => updateEntry(entry.id, { year: e.target.value })} placeholder="2020 — 2022" className={cls.inputSm} />
            </Field>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Description (optionnel)</label>
              <RichTextEditor
                key={entry.id}
                content={entry.description ?? ''}
                onChange={desc => updateEntry(entry.id, { description: desc })}
                placeholder="Spécialité, mémoire, mention…"
                minHeight={60}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => dispatch({ type: 'ADD_ENTRY', sectionId: section.id, entry: { id: nanoid(), degree: '', school: '', year: '', description: '' } as FormationEntry })}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
      >
        <Plus className="w-4 h-4" /> Ajouter une formation
      </button>
    </div>
  )
}

function CustomForm({ section, dispatch }: { section: CustomSection; dispatch: React.Dispatch<EditorAction> }) {
  const update = (patch: Partial<CustomSection>) =>
    dispatch({ type: 'UPDATE_SECTION', section: { ...section, ...patch } })

  return (
    <div className="space-y-4">
      <Field label="Titre de la section">
        <input
          type="text"
          value={section.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="ex: Certifications, Publications, Prix…"
          className={cls.input}
        />
      </Field>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-neutral-400">Contenu</label>
          <AlignButtons value={section.textAlign} onChange={v => update({ textAlign: v })} />
        </div>
        <RichTextEditor
          content={section.content}
          onChange={content => update({ content })}
          placeholder="Écrivez le contenu de cette section…"
          minHeight={120}
        />
      </div>
    </div>
  )
}

function SkillsForm({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [newSkill, setNewSkill] = useState('')
  function addSkill() {
    const t = newSkill.trim(); if (!t) return
    onChange([...items, t]); setNewSkill('')
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 min-h-8">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 text-sm text-white px-3 py-1 rounded-full">
            {item}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition ml-0.5"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {items.length === 0 && <p className="text-xs text-neutral-600 self-center">Aucune compétence</p>}
      </div>
      <div className="flex gap-2">
        <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
          placeholder="ex: React, Python… (Entrée)"
          className={`flex-1 ${cls.input}`} />
        <button onClick={addSkill} disabled={!newSkill.trim()} className="bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 disabled:opacity-30 transition">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function LanguagesForm({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const parsed = items.map(parseLang)
  function update(i: number, patch: Partial<{ name: string; level: string }>) {
    const next = parsed.map((p, j) => j === i ? { ...p, ...patch } : p)
    onChange(next.map(p => fmtLang(p.name, p.level)))
  }
  return (
    <div className="space-y-2">
      {parsed.map((lang, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input type="text" value={lang.name} onChange={e => update(i, { name: e.target.value })} placeholder="Français"
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white" />
          <select value={lang.level} onChange={e => update(i, { level: e.target.value })}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-white [&>option]:bg-neutral-900">
            <option value="">Niveau</option>
            {LANG_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition">
        <Plus className="w-4 h-4" /> Ajouter une langue
      </button>
    </div>
  )
}

function ListForm({ items, placeholder, onChange }: { items: string[]; placeholder?: string; onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input type="text" value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }}
            placeholder={placeholder} className={`flex-1 ${cls.input}`} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition">
        <Plus className="w-4 h-4" /> Ajouter
      </button>
    </div>
  )
}
