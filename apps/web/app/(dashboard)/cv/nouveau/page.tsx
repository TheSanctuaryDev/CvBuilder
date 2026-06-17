'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchTemplates, createCv } from '@/lib/api'
import type { Template, CvData } from '@/types'

const TOTAL_STEPS = 7

const emptyData: CvData = {
  fullName: '',
  email: '',
  phone: '',
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

export default function NouveauCvPage() {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setError('Impossible de charger les templates.'))
  }, [])

  const selectedTemplate = templates.find((t) => t.templateKey === selectedKey)

  function set(field: keyof CvData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit() {
    if (!selectedTemplate) return
    setLoading(true)
    setError('')
    const finalData: CvData = {
      ...data,
      experience: experiences.filter(Boolean),
      formation: formations.filter(Boolean),
      skills: skills.filter(Boolean),
    }
    const title = `${finalData.fullName || 'Mon CV'} — ${selectedTemplate.name}`
    try {
      const cv = await createCv({
        title,
        templateKey: selectedTemplate.templateKey,
        isPremium: selectedTemplate.isPremium,
      })
      router.push(`/cv/${cv.id}`)
    } catch {
      setError('Erreur lors de la création du CV. Réessayez.')
      setLoading(false)
    }
  }

  const stepTitles = [
    'Template', 'Infos personnelles', 'Résumé', 'Expériences', 'Formation', 'Compétences', 'Confirmation',
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex gap-1 mb-2">
          {stepTitles.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-amber-400' : 'bg-neutral-800'}`}
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
          <div className="grid grid-cols-2 gap-4 mb-8">
            {templates.map((t) => (
              <button
                key={t.templateKey}
                onClick={() => setSelectedKey(t.templateKey)}
                className={`text-left border rounded-xl p-4 transition ${
                  selectedKey === t.templateKey
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-neutral-700 hover:border-neutral-500'
                }`}
              >
                <div className="font-semibold text-sm mb-1">{t.name}</div>
                <div className="text-xs text-amber-400">
                  {t.isPremium ? '2000 FCFA' : 'Gratuit'}
                </div>
              </button>
            ))}
          </div>
          <button
            disabled={!selectedKey}
            onClick={() => setStep(2)}
            className="w-full bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition disabled:opacity-40"
          >
            Continuer →
          </button>
        </div>
      )}

      {/* Step 2: Infos personnelles */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Informations personnelles</h2>
          <div className="space-y-4">
            {(
              [
                { label: 'Nom complet *', field: 'fullName', placeholder: 'Jean Dupont', required: true },
                { label: 'Email', field: 'email', placeholder: 'jean@exemple.com', required: false },
                { label: 'Téléphone', field: 'phone', placeholder: '+229 97000000', required: false },
                { label: 'Ville / Adresse', field: 'address', placeholder: 'Cotonou, Bénin', required: false },
                { label: 'Titre professionnel', field: 'fieldOfActivity', placeholder: 'Développeur Full Stack', required: false },
                { label: 'LinkedIn', field: 'linkedIn', placeholder: 'linkedin.com/in/jean-dupont', required: false },
                { label: 'GitHub', field: 'gitHub', placeholder: 'github.com/jean-dupont', required: false },
              ] as Array<{ label: string; field: keyof CvData; placeholder: string; required: boolean }>
            ).map(({ label, field, placeholder, required }) => (
              <div key={field}>
                <label className="block text-sm text-neutral-300 mb-1">{label}</label>
                <input
                  type="text"
                  value={(data[field] as string) ?? ''}
                  onChange={set(field)}
                  placeholder={placeholder}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
                {required && !data[field] && (
                  <p className="text-xs text-red-400 mt-1">Champ requis</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(1)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button
              disabled={!data.fullName}
              onClick={() => setStep(3)}
              className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition disabled:opacity-40"
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Résumé */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Résumé professionnel</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Présentez-vous en 3-5 phrases. L&apos;IA utilisera ce texte pour structurer votre CV.
          </p>
          <textarea
            value={data.summary ?? ''}
            onChange={set('summary')}
            placeholder="Ex : Développeur Full Stack avec 5 ans d'expérience en React et .NET…"
            rows={6}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
          />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(4)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
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
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
                />
                {experiences.length > 1 && (
                  <button
                    onClick={() => setExperiences(experiences.filter((_, j) => j !== i))}
                    className="text-neutral-500 hover:text-red-400 transition text-lg self-start pt-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setExperiences([...experiences, ''])}
              className="text-amber-400 text-sm hover:underline"
            >
              + Ajouter une expérience
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(3)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(5)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
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
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
                />
                {formations.length > 1 && (
                  <button
                    onClick={() => setFormations(formations.filter((_, j) => j !== i))}
                    className="text-neutral-500 hover:text-red-400 transition text-lg self-start pt-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setFormations([...formations, ''])}
              className="text-amber-400 text-sm hover:underline"
            >
              + Ajouter une formation
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(4)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(6)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
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
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  {skills.length > 1 && (
                    <button onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setSkills([...skills, ''])} className="text-amber-400 text-sm hover:underline">
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
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(5)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(7)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
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
                {selectedTemplate?.isPremium ? 'Premium — 2000 FCFA' : 'Gratuit — 0 FCFA'}
              </span>
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl px-4 py-3 text-sm text-blue-300 mb-6">
            La génération IA sera disponible en Phase 3. Votre CV sera enregistré et vous pourrez le compléter plus tard.
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(6)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !data.fullName || !selectedKey}
              className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition disabled:opacity-40"
            >
              {loading ? 'Création…' : 'Créer mon CV →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
