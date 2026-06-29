// apps/web/lib/cv-sections.ts
import { nanoid } from 'nanoid'
import type { CvData } from '@/types'
import type {
  CvSection,
  HeaderSection,
  SummarySection,
  ExperienceSection,
  FormationSection,
  SkillsSection,
  LanguagesSection,
  InterestsSection,
  ReferencesSection,
} from '@/types/editor'

export function cvDataToSections(data: CvData): CvSection[] {
  const sections: CvSection[] = []

  const header: HeaderSection = {
    id: nanoid(),
    type: 'header',
    order: 0,
    fullName: data.fullName,
    jobTitle: data.fieldOfActivity ?? '',
    emails: data.emails?.length ? data.emails : [],
    phones: data.phones?.length ? data.phones : [],
    address: data.address,
    linkedIn: data.linkedIn,
    gitHub: data.gitHub,
  }
  sections.push(header)

  if (data.summary) {
    sections.push({ id: nanoid(), type: 'summary', order: 0, text: data.summary } satisfies SummarySection)
  }

  if (data.experience?.length) {
    sections.push({
      id: nanoid(),
      type: 'experience',
      order: 0,
      entries: data.experience.map(exp => ({
        id: nanoid(), title: '', company: '', startDate: '', endDate: '', description: exp,
      })),
    } satisfies ExperienceSection)
  }

  if (data.formation?.length) {
    sections.push({
      id: nanoid(),
      type: 'formation',
      order: 0,
      entries: data.formation.map(f => ({
        id: nanoid(), degree: '', school: '', year: '', description: f,
      })),
    } satisfies FormationSection)
  }

  if (data.skills?.length) {
    sections.push({ id: nanoid(), type: 'skills', order: 0, items: data.skills } satisfies SkillsSection)
  }

  if (data.languages) {
    sections.push({ id: nanoid(), type: 'languages', order: 0, items: [data.languages] } satisfies LanguagesSection)
  }

  if (data.interests?.length) {
    sections.push({ id: nanoid(), type: 'interests', order: 0, items: data.interests } satisfies InterestsSection)
  }

  if (data.references?.length) {
    sections.push({ id: nanoid(), type: 'references', order: 0, items: data.references } satisfies ReferencesSection)
  }

  // Réappliquer l'ordre sauvegardé (drag-and-drop persisté)
  if (data.sectionOrder?.length) {
    const orderMap = new Map(data.sectionOrder.map((type, i) => [type, i]))
    sections.sort((a, b) => {
      const oa = orderMap.get(a.type) ?? 999
      const ob = orderMap.get(b.type) ?? 999
      return oa - ob
    })
  }

  return sections.map((s, i) => ({ ...s, order: i }))
}

export function sectionsToCvData(sections: CvSection[]): Partial<CvData> & { fullName: string } {
  const sorted = [...sections].sort((a, b) => a.order - b.order)
  const result: Partial<CvData> & { fullName: string } = {
    fullName: '',
    sectionOrder: sorted.map(s => s.type),
  }

  for (const section of sorted) {
    switch (section.type) {
      case 'header':
        result.fullName = section.fullName
        result.fieldOfActivity = section.jobTitle
        result.emails = section.emails
        result.phones = section.phones
        result.address = section.address
        result.linkedIn = section.linkedIn
        result.gitHub = section.gitHub
        break
      case 'summary':
        result.summary = section.text
        break
      case 'experience':
        result.experience = section.entries.map(e =>
          [e.title, e.company, e.startDate, e.endDate, e.description]
            .filter(Boolean)
            .join(' — ')
        )
        break
      case 'formation':
        result.formation = section.entries.map(e =>
          [e.degree, e.school, e.year, e.description].filter(Boolean).join(' — ')
        )
        break
      case 'skills':
        result.skills = section.items
        break
      case 'languages':
        result.languages = section.items.join(', ')
        break
      case 'interests':
        result.interests = section.items
        break
      case 'references':
        result.references = section.items
        break
    }
  }

  return result
}

/**
 * Détecte le format des données CV et retourne les sections.
 * Nouveau format : { sections: CvSection[] } stocké directement.
 * Ancien format  : CvData (champs fullName, experience[], etc.) — rétrocompatible.
 */
export function rawDataToSections(data: Record<string, unknown> | null | undefined): CvSection[] {
  if (!data) return []
  if (Array.isArray((data as Record<string, unknown>).sections)) {
    return (data as { sections: CvSection[] }).sections
  }
  return cvDataToSections(data as unknown as CvData)
}
