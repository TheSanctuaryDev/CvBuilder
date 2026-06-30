// apps/web/lib/__tests__/editor-reducer.test.ts
import { describe, it, expect } from 'vitest'
import { editorReducer } from '../editor-reducer'
import type { EditorState, CvSection } from '@/types/editor'

const makeState = (overrides: Partial<EditorState> = {}): EditorState => ({
  cvId: 'cv-1',
  templateKey: 'moderne',
  sections: [
    { id: 's1', type: 'header', order: 0, fullName: 'Jean', jobTitle: 'Dev' },
    { id: 's2', type: 'summary', order: 1, text: 'Expert React' },
    { id: 's3', type: 'experience', order: 2, entries: [
      { id: 'e1', title: 'Dev', company: 'Acme', startDate: '2022', endDate: '2024', description: '...' }
    ]},
  ],
  activeSectionId: null,
  isDirty: false,
  past: [],
  future: [],
  ...overrides,
})

describe('editorReducer', () => {
  it('SET_ACTIVE met à jour activeSectionId', () => {
    const state = editorReducer(makeState(), { type: 'SET_ACTIVE', id: 's2' })
    expect(state.activeSectionId).toBe('s2')
  })

  it('UPDATE_SECTION remplace la section et marque isDirty', () => {
    const updated: CvSection = { id: 's2', type: 'summary', order: 1, text: 'Modifié' }
    const state = editorReducer(makeState(), { type: 'UPDATE_SECTION', section: updated })
    const s2 = state.sections.find(s => s.id === 's2')
    expect(s2).toMatchObject({ text: 'Modifié' })
    expect(state.isDirty).toBe(true)
  })

  it('DELETE_SECTION retire la section et remet activeSectionId à null', () => {
    const state = editorReducer(makeState({ activeSectionId: 's2' }), { type: 'DELETE_SECTION', id: 's2' })
    expect(state.sections.find(s => s.id === 's2')).toBeUndefined()
    expect(state.activeSectionId).toBeNull()
    expect(state.isDirty).toBe(true)
  })

  it('REORDER réordonne les sections', () => {
    const state = editorReducer(makeState(), { type: 'REORDER', ids: ['s3', 's1', 's2'] })
    expect(state.sections.find(s => s.id === 's3')?.order).toBe(0)
    expect(state.sections.find(s => s.id === 's1')?.order).toBe(1)
    expect(state.sections.find(s => s.id === 's2')?.order).toBe(2)
    expect(state.isDirty).toBe(true)
  })

  it('ADD_ENTRY ajoute une entrée dans une ExperienceSection', () => {
    const state = editorReducer(makeState(), {
      type: 'ADD_ENTRY',
      sectionId: 's3',
      entry: { id: 'e2', title: 'Lead Dev', company: 'Beta', startDate: '2024', endDate: '2025', description: 'New' },
    })
    const exp = state.sections.find(s => s.id === 's3')
    if (exp?.type !== 'experience') throw new Error()
    expect(exp.entries).toHaveLength(2)
  })

  it('DELETE_ENTRY retire une entrée', () => {
    const state = editorReducer(makeState(), {
      type: 'DELETE_ENTRY', sectionId: 's3', entryId: 'e1',
    })
    const exp = state.sections.find(s => s.id === 's3')
    if (exp?.type !== 'experience') throw new Error()
    expect(exp.entries).toHaveLength(0)
  })

  it('MARK_SAVED remet isDirty à false', () => {
    const state = editorReducer(makeState({ isDirty: true }), { type: 'MARK_SAVED' })
    expect(state.isDirty).toBe(false)
  })

  it('INIT_SECTIONS remplace toutes les sections et remet isDirty à false', () => {
    const newSections: CvSection[] = [
      { id: 'x1', type: 'summary', order: 0, text: 'Nouveau profil' },
    ]
    const state = editorReducer(makeState({ isDirty: true }), { type: 'INIT_SECTIONS', sections: newSections })
    expect(state.sections).toHaveLength(1)
    expect(state.sections[0].id).toBe('x1')
    expect(state.isDirty).toBe(false)
  })
})
