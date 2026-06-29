// apps/web/types/editor.ts

export type SectionType =
  | 'header'
  | 'summary'
  | 'experience'
  | 'formation'
  | 'skills'
  | 'languages'
  | 'interests'
  | 'references'

export type HeaderSection = {
  id: string
  type: 'header'
  order: number
  hidden?: boolean
  fullName: string
  jobTitle: string
  emails?: string[]
  phones?: import('@/types').PhoneEntry[]
  address?: string
  linkedIn?: string
  gitHub?: string
  photoBase64?: string
}

export type ExperienceEntry = {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate: string
  currentPosition?: boolean
  description: string
}

export type FormationEntry = {
  id: string
  degree: string
  school: string
  year: string
  location?: string
  description?: string
}

export type SummarySection = {
  id: string
  type: 'summary'
  order: number
  hidden?: boolean
  text: string
}

export type ExperienceSection = {
  id: string
  type: 'experience'
  order: number
  hidden?: boolean
  entries: ExperienceEntry[]
}

export type FormationSection = {
  id: string
  type: 'formation'
  order: number
  hidden?: boolean
  entries: FormationEntry[]
}

export type SkillsSection = {
  id: string
  type: 'skills'
  order: number
  hidden?: boolean
  items: string[]
}

export type LanguagesSection = {
  id: string
  type: 'languages'
  order: number
  hidden?: boolean
  items: string[]
}

export type InterestsSection = {
  id: string
  type: 'interests'
  order: number
  hidden?: boolean
  items: string[]
}

export type ReferencesSection = {
  id: string
  type: 'references'
  order: number
  hidden?: boolean
  items: string[]
}

export type CvSection =
  | HeaderSection
  | SummarySection
  | ExperienceSection
  | FormationSection
  | SkillsSection
  | LanguagesSection
  | InterestsSection
  | ReferencesSection

export type EditorState = {
  cvId: string
  templateKey: string
  sections: CvSection[]
  activeSectionId: string | null
  isDirty: boolean
  past: CvSection[][]
  future: CvSection[][]
}

export type EditorAction =
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'UPDATE_SECTION'; section: CvSection }
  | { type: 'DELETE_SECTION'; id: string }
  | { type: 'ADD_SECTION'; section: CvSection }
  | { type: 'TOGGLE_VISIBILITY'; id: string }
  | { type: 'ADD_ENTRY'; sectionId: string; entry: ExperienceEntry | FormationEntry }
  | { type: 'DELETE_ENTRY'; sectionId: string; entryId: string }
  | { type: 'REORDER'; ids: string[] }
  | { type: 'SET_TEMPLATE'; templateKey: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_SAVED' }
  | { type: 'INIT_SECTIONS'; sections: CvSection[] }
