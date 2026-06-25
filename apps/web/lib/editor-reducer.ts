// apps/web/lib/editor-reducer.ts
import type {
  EditorState,
  EditorAction,
  ExperienceSection,
  FormationSection,
  ExperienceEntry,
  FormationEntry,
} from '@/types/editor'

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_ACTIVE':
      return { ...state, activeSectionId: action.id }

    case 'UPDATE_SECTION':
      return {
        ...state,
        isDirty: true,
        sections: state.sections.map(s =>
          s.id === action.section.id ? action.section : s
        ),
      }

    case 'DELETE_SECTION':
      return {
        ...state,
        isDirty: true,
        activeSectionId: null,
        sections: state.sections.filter(s => s.id !== action.id),
      }

    case 'ADD_ENTRY': {
      const sections = state.sections.map(s => {
        if (s.id !== action.sectionId) return s
        if (s.type === 'experience') {
          return {
            ...s,
            entries: [...(s as ExperienceSection).entries, action.entry as ExperienceEntry],
          }
        }
        if (s.type === 'formation') {
          return {
            ...s,
            entries: [...(s as FormationSection).entries, action.entry as FormationEntry],
          }
        }
        return s
      })
      return { ...state, isDirty: true, sections }
    }

    case 'DELETE_ENTRY': {
      const sections = state.sections.map(s => {
        if (s.id !== action.sectionId) return s
        if (s.type === 'experience') {
          return {
            ...s,
            entries: (s as ExperienceSection).entries.filter(e => e.id !== action.entryId),
          }
        }
        if (s.type === 'formation') {
          return {
            ...s,
            entries: (s as FormationSection).entries.filter(e => e.id !== action.entryId),
          }
        }
        return s
      })
      return { ...state, isDirty: true, sections }
    }

    case 'REORDER':
      return {
        ...state,
        isDirty: true,
        sections: action.ids.map((id, i) => ({
          ...state.sections.find(s => s.id === id)!,
          order: i,
        })),
      }

    case 'MARK_SAVED':
      return { ...state, isDirty: false }

    case 'INIT_SECTIONS':
      return { ...state, sections: action.sections, isDirty: false }

    default:
      return state
  }
}
