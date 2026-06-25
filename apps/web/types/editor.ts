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
  fullName: string
  jobTitle: string
  email?: string
  phone?: string
  address?: string
  linkedIn?: string
  gitHub?: string
}

export type ExperienceEntry = {
  id: string
  title: string
  company: string
  startDate: string
  endDate: string
  description: string
}

export type FormationEntry = {
  id: string
  degree: string
  school: string
  year: string
  description?: string
}

export type SummarySection = {
  id: string
  type: 'summary'
  order: number
  text: string
}

export type ExperienceSection = {
  id: string
  type: 'experience'
  order: number
  entries: ExperienceEntry[]
}

export type FormationSection = {
  id: string
  type: 'formation'
  order: number
  entries: FormationEntry[]
}

export type SkillsSection = {
  id: string
  type: 'skills'
  order: number
  items: string[]
}

export type LanguagesSection = {
  id: string
  type: 'languages'
  order: number
  items: string[]
}

export type InterestsSection = {
  id: string
  type: 'interests'
  order: number
  items: string[]
}

export type ReferencesSection = {
  id: string
  type: 'references'
  order: number
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
}

export type EditorAction =
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'UPDATE_SECTION'; section: CvSection }
  | { type: 'DELETE_SECTION'; id: string }
  | { type: 'ADD_ENTRY'; sectionId: string; entry: ExperienceEntry | FormationEntry }
  | { type: 'DELETE_ENTRY'; sectionId: string; entryId: string }
  | { type: 'REORDER'; ids: string[] }
  | { type: 'MARK_SAVED' }
  | { type: 'INIT_SECTIONS'; sections: CvSection[] }
