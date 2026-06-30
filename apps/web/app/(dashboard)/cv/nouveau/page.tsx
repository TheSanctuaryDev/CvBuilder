'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchTemplates, createCv, patchCv } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, X, ArrowRight, Loader2, Plus, Check } from 'lucide-react'
import type { Template, CvData, PhoneEntry } from '@/types'
import { COUNTRY_CODES } from '@/lib/country-codes'
import { trackEvent } from '@/components/PostHogProvider'

const TOTAL_STEPS = 7
const DRAFT_KEY = 'cv_wizard_draft'

// Couleur d'accent par template pour l'aperçu miniature
const TEMPLATE_COLORS: Record<string, string> = {
  classique:     'from-slate-500 to-slate-700',
  moderne:       'from-emerald-500 to-emerald-700',
  elegant:       'from-purple-500 to-purple-800',
  executif:      'from-indigo-600 to-indigo-900',
  minimaliste:   'from-neutral-400 to-neutral-600',
  creatif:       'from-orange-400 to-orange-700',
  tech:          'from-cyan-500 to-cyan-800',
  academique:    'from-amber-400 to-amber-700',
  professionnel: 'from-blue-500 to-blue-800',
  bold:          'from-red-500 to-red-800',
  startuper:     'from-pink-400 to-pink-700',
  designer:      'from-violet-500 to-violet-800',
  consultant:    'from-sky-500 to-sky-800',
  manager:       'from-blue-700 to-blue-950',
  ingenieur:     'from-green-500 to-green-800',
}

interface WizardDraft {
  selectedKey: string
  data: CvData
  experiences: string[]
  formations: string[]
  skills: string[]
  phones: PhoneEntry[]
  emails: string[]
}

const emptyData: CvData = {
  fullName: '',
  address: '',
  linkedIn: '',
  gitHub: '',
  fieldOfActivity: '',
  summary: '',
  experience: [],
  formation: [],
  skills: [],
  languages: '',
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidNumber(v: string) {
  // BUG-26 : rejeter les chaînes composées uniquement d'espaces/tirets
  return /^[\d\s\-]{4,15}$/.test(v) && /\d{4,}/.test(v.replace(/\D/g, ''))
}

function NouveauCvForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedKey = searchParams.get('template') ?? ''

  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedKey, setSelectedKey] = useState(preselectedKey)
  const [data, setData] = useState<CvData>(emptyData)
  const [experiences, setExperiences] = useState<string[]>([''])
  const [formations, setFormations] = useState<string[]>([''])
  const [skills, setSkills] = useState<string[]>([''])
  const [phones, setPhones] = useState<PhoneEntry[]>([{ indicatif: '+229', number: '' }])
  const [emails, setEmails] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null)
  const isSubmittingRef = useRef(false) // BUG-03 : guard contre la double soumission

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setError('Impossible de charger les templates.'))
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as WizardDraft
      setSelectedKey(draft.selectedKey)
      setData(draft.data)
      setExperiences(draft.experiences.length ? draft.experiences : [''])
      setFormations(draft.formations.length ? draft.formations : [''])
      setSkills(draft.skills.length ? draft.skills : [''])
      setPhones(draft.phones?.length ? draft.phones : [{ indicatif: '+229', number: '' }])
      setEmails(draft.emails?.length ? draft.emails : [''])
      // BUG-16 : pas de setStep(7) ici — le spinner (pendingDraft && templates=[]) couvre le chargement.
      // Afficher step 7 avec template undefined causerait "Template: —"
      setPendingDraft(draft)
    } catch {
      sessionStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    if (!pendingDraft || templates.length === 0) return
    const template = templates.find(t => t.templateKey === pendingDraft.selectedKey)
    if (!template) {
      setError('Le template sélectionné n\'est plus disponible.')
      setPendingDraft(null)
      return
    }
    setPendingDraft(null)
    void submitCv(pendingDraft, template)
  }, [pendingDraft, templates])

  const selectedTemplate = templates.find((t) => t.templateKey === selectedKey)

  function set(field: keyof CvData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function submitCv(draft: WizardDraft, template: Template) {
    // BUG-03 : guard synchrone contre les doubles soumissions
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setLoading(true)
    setError('')
    const finalData: CvData = {
      ...draft.data,
      experience: draft.experiences.filter(Boolean),
      formation: draft.formations.filter(Boolean),
      skills: draft.skills.filter(Boolean),
      phones: (draft.phones ?? []).filter(p => p.number.trim()),
      emails: (draft.emails ?? []).filter(e => e.trim()),
    }
    const title = `${finalData.fullName || 'Mon CV'} — ${template.name}`
    try {
      const cv = await createCv({
        title,
        templateKey: template.templateKey,
        isPremium: template.isPremium,
      })
      // Persister immédiatement les données du wizard (sinon l'éditeur s'ouvre vide)
      await patchCv(cv.id, finalData)
      sessionStorage.removeItem(DRAFT_KEY)
      router.push(`/cv/${cv.id}`)
    } catch {
      setError('Erreur lors de la création du CV. Réessayez.')
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  async function handleSubmit() {
    if (!selectedTemplate) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const draft: WizardDraft = { selectedKey, data, experiences, formations, skills, phones, emails }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      router.push('/register?returnTo=/cv/nouveau')
      return
    }

    await submitCv({ selectedKey, data, experiences, formations, skills, phones, emails }, selectedTemplate)
  }

  const stepTitles = [
    'Template', 'Infos personnelles', 'Résumé', 'Expériences', 'Formation', 'Compétences', 'Confirmation',
  ]

  if (pendingDraft && templates.length === 0) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex gap-1 mb-2">
          {stepTitles.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-white' : 'bg-neutral-800'}`}
            />
          ))}
        </div>
        <p className="text-sm text-neutral-400">
          Étape {step}/{TOTAL_STEPS} — <span className="text-white">{stepTitles[step - 1]}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Template */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Choisissez votre template</h2>
          {templates.length === 0 && !error && (
            <p className="text-neutral-400 text-sm">Chargement des templates…</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {templates.map((t) => {
              const gradient = TEMPLATE_COLORS[t.templateKey] ?? 'from-neutral-500 to-neutral-700'
              const selected = selectedKey === t.templateKey
              return (
                <button
                  key={t.templateKey}
                  onClick={() => { setSelectedKey(t.templateKey); trackEvent('template_selected', { templateKey: t.templateKey }) }}
                  className={`relative text-left rounded-xl overflow-hidden border-2 transition-all ${
                    selected ? 'border-white scale-[1.02]' : 'border-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  {/* Mini aperçu CV */}
                  <div className="bg-white">
                    {/* Header coloré */}
                    <div className={`h-8 w-full bg-gradient-to-br ${gradient}`} />
                    {/* Lignes de contenu */}
                    <div className="px-2 py-2 space-y-1">
                      <div className="h-1.5 bg-neutral-300 rounded-sm w-3/4" />
                      <div className="h-1 bg-neutral-200 rounded-sm w-1/2" />
                      <div className="h-px bg-neutral-300 w-full my-1.5" />
                      <div className="h-1 bg-neutral-200 rounded-sm w-full" />
                      <div className="h-1 bg-neutral-200 rounded-sm w-4/5" />
                      <div className="h-1 bg-neutral-200 rounded-sm w-3/5" />
                      <div className="h-1 bg-neutral-300 rounded-sm w-2/5 mt-1.5" />
                      <div className="h-1 bg-neutral-200 rounded-sm w-full" />
                      <div className="h-1 bg-neutral-200 rounded-sm w-3/4" />
                      <div className="h-1 bg-neutral-200 rounded-sm w-5/6" />
                    </div>
                  </div>
                  {/* Nom + badge */}
                  <div className="bg-neutral-900 px-2.5 py-2 flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white truncate">{t.name}</span>
                    <span className={`text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded ${
                      t.isPremium ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-700 text-neutral-300'
                    }`}>
                      {t.isPremium ? '2 000 F' : 'Gratuit'}
                    </span>
                  </div>
                  {/* Check sélection */}
                  {selected && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <button
            disabled={!selectedKey}
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition disabled:opacity-40"
          >
            Continuer <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Infos personnelles */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Informations personnelles</h2>
          <div className="space-y-4">

            {/* Nom complet */}
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Nom complet *</label>
              <input
                type="text"
                value={data.fullName}
                onChange={set('fullName')}
                placeholder="Jean Dupont"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
              {!data.fullName && (
                <p className="text-xs text-red-400 mt-1">Champ requis</p>
              )}
            </div>

            {/* Emails (max 2) */}
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Email</label>
              <div className="space-y-2">
                {emails.map((email, i) => {
                  const invalid = email.length > 0 && !isValidEmail(email)
                  return (
                    <div key={i} className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={e => {
                          const next = [...emails]
                          next[i] = e.target.value
                          setEmails(next)
                        }}
                        placeholder="jean@exemple.com"
                        className={`flex-1 bg-neutral-900 border rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white ${
                          invalid ? 'border-red-500' : 'border-neutral-700'
                        }`}
                      />
                      {emails.length > 1 && (
                        <button
                          onClick={() => setEmails(emails.filter((_, j) => j !== i))}
                          className="text-neutral-500 hover:text-red-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {emails.length < 2 && (
                  <button
                    onClick={() => setEmails([...emails, ''])}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un email
                  </button>
                )}
              </div>
            </div>

            {/* Téléphones (max 3) */}
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Téléphone</label>
              <div className="space-y-2">
                {phones.map((phone, i) => {
                  const invalid = phone.number.length > 0 && !isValidNumber(phone.number)
                  return (
                    <div key={i} className="flex gap-2">
                      <select
                        value={phone.indicatif}
                        onChange={e => {
                          const next = [...phones]
                          next[i] = { ...next[i], indicatif: e.target.value }
                          setPhones(next)
                        }}
                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-white [&>option]:bg-neutral-900"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phone.number}
                        onChange={e => {
                          const next = [...phones]
                          next[i] = { ...next[i], number: e.target.value }
                          setPhones(next)
                        }}
                        placeholder="97000000"
                        className={`flex-1 bg-neutral-900 border rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white ${
                          invalid ? 'border-red-500' : 'border-neutral-700'
                        }`}
                      />
                      {phones.length > 1 && (
                        <button
                          onClick={() => setPhones(phones.filter((_, j) => j !== i))}
                          className="text-neutral-500 hover:text-red-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {phones.length < 3 && (
                  <button
                    onClick={() => setPhones([...phones, { indicatif: '+229', number: '' }])}
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un téléphone
                  </button>
                )}
              </div>
            </div>

            {/* Autres champs */}
            {(
              [
                { label: 'Ville / Adresse',       field: 'address',       placeholder: 'Cotonou, Bénin' },
                { label: 'Titre professionnel',    field: 'fieldOfActivity', placeholder: 'Développeur Full Stack' },
                { label: 'LinkedIn',               field: 'linkedIn',      placeholder: 'linkedin.com/in/jean-dupont' },
                { label: 'GitHub',                 field: 'gitHub',        placeholder: 'github.com/jean-dupont' },
              ] as Array<{ label: string; field: keyof CvData; placeholder: string }>
            ).map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="block text-sm text-neutral-300 mb-1">{label}</label>
                <input
                  type="text"
                  value={(data[field] as string) ?? ''}
                  onChange={set(field)}
                  placeholder={placeholder}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <button
              disabled={!data.fullName}
              onClick={() => setStep(3)}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition disabled:opacity-40"
            >
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Résumé */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Résumé professionnel</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Présentez-vous en 3-5 phrases. Ce texte apparaîtra dans la section profil de votre CV.
          </p>
          <textarea
            value={data.summary ?? ''}
            onChange={set('summary')}
            placeholder="Ex : Développeur Full Stack avec 5 ans d'expérience en React et .NET…"
            rows={6}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
          />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition">
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Expériences */}
      {step === 4 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Expériences professionnelles</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Décrivez chaque expérience librement (poste, entreprise, dates, missions).
          </p>
          <div className="space-y-3">
            {experiences.map((exp, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  value={exp}
                  onChange={(e) => {
                    const next = [...experiences]
                    next[i] = e.target.value
                    setExperiences(next)
                  }}
                  placeholder={`Expérience ${i + 1} : Ex. Développeur chez Acme (2022-2024) — React, Node.js`}
                  rows={3}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                />
                {experiences.length > 1 && (
                  <button
                    onClick={() => setExperiences(experiences.filter((_, j) => j !== i))}
                    className="text-neutral-500 hover:text-red-400 transition self-start pt-3"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setExperiences([...experiences, ''])} className="text-white text-sm hover:underline">
              + Ajouter une expérience
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={() => setStep(5)} className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition">
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Formation */}
      {step === 5 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Formation</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Décrivez chaque diplôme ou formation (titre, établissement, année).
          </p>
          <div className="space-y-3">
            {formations.map((f, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  value={f}
                  onChange={(e) => {
                    const next = [...formations]
                    next[i] = e.target.value
                    setFormations(next)
                  }}
                  placeholder={`Formation ${i + 1} : Ex. Master Informatique — Université d'Abomey-Calavi (2020)`}
                  rows={2}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                />
                {formations.length > 1 && (
                  <button
                    onClick={() => setFormations(formations.filter((_, j) => j !== i))}
                    className="text-neutral-500 hover:text-red-400 transition self-start pt-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setFormations([...formations, ''])} className="text-white text-sm hover:underline">
              + Ajouter une formation
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={() => setStep(6)} className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition">
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Compétences & Langues */}
      {step === 6 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Compétences &amp; Langues</h2>
          <div className="mb-6">
            <label className="block text-sm text-neutral-300 mb-3">Compétences</label>
            <div className="space-y-2">
              {skills.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={s}
                    onChange={(e) => {
                      const next = [...skills]
                      next[i] = e.target.value
                      setSkills(next)
                    }}
                    placeholder="Ex. React, TypeScript, .NET"
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                  />
                  {skills.length > 1 && (
                    <button onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setSkills([...skills, ''])} className="text-white text-sm hover:underline">
                + Ajouter une compétence
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Langues</label>
            <input
              type="text"
              value={data.languages ?? ''}
              onChange={set('languages')}
              placeholder="Ex. Français (natif), Anglais (courant)"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(5)} className="flex-1 flex items-center justify-center gap-2 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={() => setStep(7)} className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition">
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Confirmation */}
      {step === 7 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Confirmation</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Template</span>
              <span className="font-semibold">{selectedTemplate?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Nom</span>
              <span className="font-semibold">{data.fullName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Type</span>
              <span className={selectedTemplate?.isPremium ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
                {selectedTemplate?.isPremium ? 'Premium — 2 000 FCFA' : 'Gratuit — 0 FCFA'}
              </span>
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl px-4 py-3 text-sm text-blue-300 mb-6">
            Votre CV sera enregistré. Vous pourrez le modifier et l&apos;exporter en PDF ou Word depuis l&apos;éditeur.
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(6)} className="flex-1 flex items-center justify-center gap-2 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              <ChevronLeft className="w-4 h-4" /> Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !data.fullName || !selectedKey}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition disabled:opacity-40"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</>
                : <><span>Créer mon CV</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NouveauCvPage() {
  return (
    <Suspense>
      <NouveauCvForm />
    </Suspense>
  )
}
