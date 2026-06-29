// apps/web/lib/editor-reducer.ts
import type {
  EditorState,
  EditorAction,
  CvSection,
  ExperienceSection,
  FormationSection,
  ExperienceEntry,
  FormationEntry,
} from '@/types/editor'

const MAX_HISTORY = 30

/** Snapshot les sections courantes dans past avant chaque mutation */
function withHistory(
  state: EditorState,
  newSections: CvSection[],
  isDirty = true,
): EditorState {
  return {
    ...state,
    sections: newSections,
    isDirty,
    past: [...state.past.slice(-MAX_HISTORY), state.sections],
    future: [],
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_ACTIVE':
      return { ...state, activeSectionId: action.id }

    case 'UPDATE_SECTION':
      return withHistory(
        state,
        state.sections.map(s => s.id === action.section.id ? action.section : s),
      )

    case 'DELETE_SECTION':
      return {
        ...withHistory(state, state.sections.filter(s => s.id !== action.id)),
        activeSectionId: null,
      }

    case 'ADD_SECTION': {
      const maxOrder = Math.max(...state.sections.map(s => s.order), -1)
      return {
        ...withHistory(state, [...state.sections, { ...action.section, order: maxOrder + 1 }]),
        activeSectionId: action.section.id,
      }
    }

    case 'TOGGLE_VISIBILITY':
      return withHistory(
        state,
        state.sections.map(s => s.id === action.id ? { ...s, hidden: !s.hidden } : s),
      )

    case 'ADD_ENTRY': {
      const sections = state.sections.map(s => {
        if (s.id !== action.sectionId) return s
        if (s.type === 'experience') {
          return { ...s, entries: [...(s as ExperienceSection).entries, action.entry as ExperienceEntry] }
        }
        if (s.type === 'formation') {
          return { ...s, entries: [...(s as FormationSection).entries, action.entry as FormationEntry] }
        }
        return s
      })
      return withHistory(state, sections)
    }

    case 'DELETE_ENTRY': {
      const sections = state.sections.map(s => {
        if (s.id !== action.sectionId) return s
        if (s.type === 'experience') {
          return { ...s, entries: (s as ExperienceSection).entries.filter(e => e.id !== action.entryId) }
        }
        if (s.type === 'formation') {
          return { ...s, entries: (s as FormationSection).entries.filter(e => e.id !== action.entryId) }
        }
        return s
      })
      return withHistory(state, sections)
    }

    case 'REORDER':
      return withHistory(
        state,
        action.ids.map((id, i) => ({ ...state.sections.find(s => s.id === id)!, order: i })),
      )

    case 'UNDO':
      if (state.past.length === 0) return state
      return {
        ...state,
        sections: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.sections, ...state.future.slice(0, MAX_HISTORY)],
        isDirty: true,
      }

    case 'REDO':
      if (state.future.length === 0) return state
      return {
        ...state,
        sections: state.future[0],
        past: [...state.past.slice(-MAX_HISTORY), state.sections],
        future: state.future.slice(1),
        isDirty: true,
      }

    case 'SET_TEMPLATE':
      return { ...state, templateKey: action.templateKey }

    case 'MARK_SAVED':
      return { ...state, isDirty: false }

    case 'INIT_SECTIONS':
      return { ...state, sections: action.sections, isDirty: false, past: [], future: [] }

    default:
      return state
  }
}
