// apps/web/components/editor/SectionPanel.tsx
'use client'

import { nanoid } from 'nanoid'
import type { CvSection, EditorAction, ExperienceSection, FormationSection } from '@/types/editor'

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
        <span className="text-3xl mb-3">←</span>
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
            ✕
          </button>
        </div>

        {section.type === 'header' && (
          <div className="space-y-3">
            {(
              [
                { label: 'Nom complet *', field: 'fullName' },
                { label: 'Titre professionnel', field: 'jobTitle' },
                { label: 'Email', field: 'email' },
                { label: 'Téléphone', field: 'phone' },
                { label: 'Adresse', field: 'address' },
                { label: 'LinkedIn', field: 'linkedIn' },
                { label: 'GitHub', field: 'gitHub' },
              ] as Array<{ label: string; field: string }>
            ).map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs text-neutral-400 mb-1">{label}</label>
                <input
                  type="text"
                  value={(section as unknown as Record<string, string>)[field] ?? ''}
                  onChange={e =>
                    dispatch({
                      type: 'UPDATE_SECTION',
                      section: { ...section, [field]: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>
            ))}
          </div>
        )}

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
                    ✕
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
                    ✕
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
                  ✕
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
