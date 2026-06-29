// apps/web/components/editor/SectionPanel.tsx
'use client'

import { nanoid } from 'nanoid'
import { MousePointerClick, X, Plus } from 'lucide-react'
import type { CvSection, EditorAction, ExperienceSection, FormationSection, HeaderSection } from '@/types/editor'
import type { PhoneEntry } from '@/types'
import { COUNTRY_CODES } from '@/lib/country-codes'

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}
function isValidNumber(v: string) {
  return /^[\d\s\-]{4,15}$/.test(v)
}

interface SectionPanelProps {
  sections: CvSection[]
  activeSectionId: string | null
  dispatch: React.Dispatch<EditorAction>
}

export default function SectionPanel({ sections, activeSectionId, dispatch }: SectionPanelProps) {
  const section = sections.find(s => s.id === activeSectionId)

  if (!section) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full text-neutral-500 text-sm p-8">
        <MousePointerClick className="w-8 h-8 mb-3 text-neutral-600" />
        <p className="text-center">Cliquez sur une section du CV pour l&apos;éditer</p>
      </div>
    )
  }

  function handleDelete() {
    if (!confirm('Supprimer cette section ?')) return
    dispatch({ type: 'DELETE_SECTION', id: section!.id })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-sm capitalize">{section.type}</h3>
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE', id: null })}
            className="text-neutral-400 hover:text-white text-lg leading-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {section.type === 'header' && (() => {
          const h = section as HeaderSection
          const emails: string[] = h.emails?.length ? h.emails : ['']
          const phones: PhoneEntry[] = h.phones?.length ? h.phones : [{ indicatif: '+229', number: '' }]

          function updateEmails(next: string[]) {
            dispatch({ type: 'UPDATE_SECTION', section: { ...h, emails: next } })
          }
          function updatePhones(next: PhoneEntry[]) {
            dispatch({ type: 'UPDATE_SECTION', section: { ...h, phones: next } })
          }

          return (
            <div className="space-y-3">
              {/* Champs texte simples */}
              {(
                [
                  { label: 'Nom complet *', field: 'fullName' },
                  { label: 'Titre professionnel', field: 'jobTitle' },
                  { label: 'Adresse', field: 'address' },
                  { label: 'LinkedIn', field: 'linkedIn' },
                  { label: 'GitHub', field: 'gitHub' },
                ] as Array<{ label: string; field: string }>
              ).map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs text-neutral-400 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(h as unknown as Record<string, string>)[field] ?? ''}
                    onChange={e => dispatch({ type: 'UPDATE_SECTION', section: { ...h, [field]: e.target.value } })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                  />
                </div>
              ))}

              {/* Emails (max 2) */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Email</label>
                <div className="space-y-1.5">
                  {emails.map((email, i) => {
                    const invalid = email.length > 0 && !isValidEmail(email)
                    return (
                      <div key={i} className="flex gap-1.5">
                        <input
                          type="email"
                          value={email}
                          onChange={e => {
                            const next = [...emails]; next[i] = e.target.value; updateEmails(next)
                          }}
                          placeholder="jean@exemple.com"
                          className={`flex-1 bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white ${invalid ? 'border-red-500' : 'border-neutral-700'}`}
                        />
                        {emails.length > 1 && (
                          <button onClick={() => updateEmails(emails.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {emails.length < 2 && (
                    <button onClick={() => updateEmails([...emails, ''])} className="flex items-center gap-1 text-neutral-500 hover:text-white text-xs transition">
                      <Plus className="w-3 h-3" /> Ajouter
                    </button>
                  )}
                </div>
              </div>

              {/* Téléphones (max 3) */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Téléphone</label>
                <div className="space-y-1.5">
                  {phones.map((phone, i) => {
                    const invalid = phone.number.length > 0 && !isValidNumber(phone.number)
                    return (
                      <div key={i} className="flex gap-1.5">
                        <select
                          value={phone.indicatif}
                          onChange={e => {
                            const next = [...phones]; next[i] = { ...next[i], indicatif: e.target.value }; updatePhones(next)
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
                            const next = [...phones]; next[i] = { ...next[i], number: e.target.value }; updatePhones(next)
                          }}
                          placeholder="97000000"
                          className={`flex-1 bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white ${invalid ? 'border-red-500' : 'border-neutral-700'}`}
                        />
                        {phones.length > 1 && (
                          <button onClick={() => updatePhones(phones.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {phones.length < 3 && (
                    <button onClick={() => updatePhones([...phones, { indicatif: '+229', number: '' }])} className="flex items-center gap-1 text-neutral-500 hover:text-white text-xs transition">
                      <Plus className="w-3 h-3" /> Ajouter
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {section.type === 'summary' && (
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Texte</label>
            <textarea
              value={section.text}
              onChange={e => dispatch({ type: 'UPDATE_SECTION', section: { ...section, text: e.target.value } })}
              rows={6}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
            />
          </div>
        )}

        {section.type === 'experience' && (
          <div className="space-y-5">
            {(section as ExperienceSection).entries.map((entry, idx) => (
              <div key={entry.id} className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-neutral-400">Expérience {idx + 1}</span>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_ENTRY', sectionId: section.id, entryId: entry.id })}
                    className="text-neutral-500 hover:text-red-400 text-sm transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {(
                  [
                    { label: 'Poste', field: 'title' },
                    { label: 'Entreprise', field: 'company' },
                    { label: 'Date début', field: 'startDate' },
                    { label: 'Date fin', field: 'endDate' },
                  ] as Array<{ label: string; field: keyof typeof entry }>
                ).map(({ label, field }) => (
                  <div key={field} className="mb-2">
                    <label className="block text-xs text-neutral-400 mb-1">{label}</label>
                    <input
                      type="text"
                      value={entry[field] as string}
                      onChange={e => {
                        const updatedEntries = (section as ExperienceSection).entries.map(en =>
                          en.id === entry.id ? { ...en, [field]: e.target.value } : en
                        )
                        dispatch({ type: 'UPDATE_SECTION', section: { ...section, entries: updatedEntries } })
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Description</label>
                  <textarea
                    value={entry.description}
                    onChange={e => {
                      const updatedEntries = (section as ExperienceSection).entries.map(en =>
                        en.id === entry.id ? { ...en, description: e.target.value } : en
                      )
                      dispatch({ type: 'UPDATE_SECTION', section: { ...section, entries: updatedEntries } })
                    }}
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white resize-none"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                dispatch({
                  type: 'ADD_ENTRY',
                  sectionId: section.id,
                  entry: { id: nanoid(), title: '', company: '', startDate: '', endDate: '', description: '' },
                })
              }
              className="text-white text-sm hover:underline"
            >
              + Ajouter une expérience
            </button>
          </div>
        )}

        {section.type === 'formation' && (
          <div className="space-y-5">
            {(section as FormationSection).entries.map((entry, idx) => (
              <div key={entry.id} className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-neutral-400">Formation {idx + 1}</span>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_ENTRY', sectionId: section.id, entryId: entry.id })}
                    className="text-neutral-500 hover:text-red-400 text-sm transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {(
                  [
                    { label: 'Diplôme', field: 'degree' },
                    { label: 'Établissement', field: 'school' },
                    { label: 'Année', field: 'year' },
                  ] as Array<{ label: string; field: keyof typeof entry }>
                ).map(({ label, field }) => (
                  <div key={field} className="mb-2">
                    <label className="block text-xs text-neutral-400 mb-1">{label}</label>
                    <input
                      type="text"
                      value={entry[field] as string ?? ''}
                      onChange={e => {
                        const updatedEntries = (section as FormationSection).entries.map(en =>
                          en.id === entry.id ? { ...en, [field]: e.target.value } : en
                        )
                        dispatch({ type: 'UPDATE_SECTION', section: { ...section, entries: updatedEntries } })
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={() =>
                dispatch({
                  type: 'ADD_ENTRY',
                  sectionId: section.id,
                  entry: { id: nanoid(), degree: '', school: '', year: '', description: '' },
                })
              }
              className="text-white text-sm hover:underline"
            >
              + Ajouter une formation
            </button>
          </div>
        )}

        {(section.type === 'skills' || section.type === 'languages' || section.type === 'interests' || section.type === 'references') && (
          <div className="space-y-2">
            {(section.items as string[]).map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={e => {
                    const items = [...(section.items as string[])]
                    items[i] = e.target.value
                    dispatch({ type: 'UPDATE_SECTION', section: { ...section, items } as CvSection })
                  }}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
                />
                <button
                  onClick={() => {
                    const items = (section.items as string[]).filter((_, j) => j !== i)
                    dispatch({ type: 'UPDATE_SECTION', section: { ...section, items } as CvSection })
                  }}
                  className="text-neutral-500 hover:text-red-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const items = [...(section.items as string[]), '']
                dispatch({ type: 'UPDATE_SECTION', section: { ...section, items } as CvSection })
              }}
              className="text-white text-sm hover:underline"
            >
              + Ajouter
            </button>
          </div>
        )}
      </div>

      {/* Supprimer la section */}
      <div className="p-5 border-t border-neutral-800">
        <button
          onClick={handleDelete}
          className="w-full text-center text-sm text-red-400 hover:text-red-300 transition py-2"
        >
          Supprimer cette section
        </button>
      </div>
    </div>
  )
}
