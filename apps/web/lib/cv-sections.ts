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
  let order = 0

  const header: HeaderSection = {
    id: nanoid(),
    type: 'header',
    order: order++,
    fullName: data.fullName,
    jobTitle: data.fieldOfActivity ?? '',
    email: data.email,
    phone: data.phone,
    address: data.address,
    linkedIn: data.linkedIn,
    gitHub: data.gitHub,
  }
  sections.push(header)

  if (data.summary) {
    const summary: SummarySection = {
      id: nanoid(), type: 'summary', order: order++, text: data.summary,
    }
    sections.push(summary)
  }

  if (data.experience?.length) {
    const experience: ExperienceSection = {
      id: nanoid(),
      type: 'experience',
      order: order++,
      entries: data.experience.map(exp => ({
        id: nanoid(), title: '', company: '', startDate: '', endDate: '', description: exp,
      })),
    }
    sections.push(experience)
  }

  if (data.formation?.length) {
    const formation: FormationSection = {
      id: nanoid(),
      type: 'formation',
      order: order++,
      entries: data.formation.map(f => ({
        id: nanoid(), degree: '', school: '', year: '', description: f,
      })),
    }
    sections.push(formation)
  }

  if (data.skills?.length) {
    const skills: SkillsSection = {
      id: nanoid(), type: 'skills', order: order++, items: data.skills,
    }
    sections.push(skills)
  }

  if (data.languages) {
    const languages: LanguagesSection = {
      id: nanoid(), type: 'languages', order: order++, items: [data.languages],
    }
    sections.push(languages)
  }

  if (data.interests?.length) {
    const interests: InterestsSection = {
      id: nanoid(), type: 'interests', order: order++, items: data.interests,
    }
    sections.push(interests)
  }

  if (data.references?.length) {
    const references: ReferencesSection = {
      id: nanoid(), type: 'references', order: order++, items: data.references,
    }
    sections.push(references)
  }

  return sections
}

export function sectionsToCvData(sections: CvSection[]): Partial<CvData> & { fullName: string } {
  const sorted = [...sections].sort((a, b) => a.order - b.order)
  const result: Partial<CvData> & { fullName: string } = { fullName: '' }

  for (const section of sorted) {
    switch (section.type) {
      case 'header':
        result.fullName = section.fullName
        result.fieldOfActivity = section.jobTitle
        result.email = section.email
        result.phone = section.phone
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
