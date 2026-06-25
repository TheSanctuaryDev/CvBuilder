# CV Visual Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter un éditeur visuel interactif (style Canva) sur `/cv/[id]/edit` permettant à l'utilisateur de faire du CRUD sur son CV via drag & drop + panneau latéral, puis d'exporter en PDF (Playwright) ou Word (docx).

**Architecture:** JSON (`CvSection[]`) est la source de vérité unique. Les composants React `cv-sections/` rendent ce JSON en HTML — aussi bien dans l'éditeur live que dans l'export PDF via Playwright. Le panneau latéral édite la section active via `useReducer`. La sauvegarde auto (debounce 2s) appelle `PATCH /api/cvs/{id}` avec le JSON reconverti en `CvData` (format DB existant).

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `docx`, `nanoid`, `playwright-chromium`, `vitest` (tests helpers purs)

## Global Constraints

- Next.js 15 App Router — jamais de Pages Router
- TypeScript strict — `npx tsc --noEmit` doit passer à zéro erreur après chaque tâche
- Thème noir & blanc uniquement — `bg-neutral-950 text-white`, boutons `bg-white text-black` — zéro amber
- Tailwind CSS uniquement — pas de CSS inline
- Server components par défaut — `'use client'` uniquement si interaction (état, événements)
- Aucun breaking change sur l'API .NET existante — `CvData` format préservé
- `NEXT_PUBLIC_API_URL` = URL du .NET API (défaut `http://localhost:5000`)
- Prix affiché : 2000 FCFA premium, 0 FCFA gratuit

---

## Fichiers créés / modifiés

```
apps/web/
├── types/editor.ts                               ← CRÉER (types CvSection, EditorState, EditorAction)
├── lib/cv-sections.ts                            ← CRÉER (cvDataToSections, sectionsToCvData)
├── lib/editor-reducer.ts                         ← CRÉER (editorReducer pure function)
├── lib/__tests__/
│   ├── cv-sections.test.ts                       ← CRÉER (tests helpers)
│   └── editor-reducer.test.ts                    ← CRÉER (tests reducer)
├── vitest.config.ts                              ← CRÉER (setup vitest)
├── components/
│   ├── cv-sections/
│   │   ├── HeaderSectionView.tsx                 ← CRÉER
│   │   ├── SummarySectionView.tsx                ← CRÉER
│   │   ├── ExperienceSectionView.tsx             ← CRÉER
│   │   ├── FormationSectionView.tsx              ← CRÉER
│   │   ├── SkillsSectionView.tsx                 ← CRÉER
│   │   └── LanguagesSectionView.tsx              ← CRÉER
│   └── editor/
│       ├── CVEditor.tsx                          ← CRÉER (orchestrateur + context + toolbar)
│       ├── CVPreview.tsx                         ← CRÉER (A4 + DnD)
│       ├── SectionBlock.tsx                      ← CRÉER (wrapper useSortable)
│       └── SectionPanel.tsx                      ← CRÉER (CRUD latéral + mobile drawer)
├── app/
│   ├── (dashboard)/cv/[id]/edit/page.tsx         ← MODIFIER (remplacer stub)
│   └── api/export/
│       ├── pdf/route.ts                          ← CRÉER (Playwright PDF)
│       └── docx/route.ts                         ← CRÉER (docx Word)
└── package.json                                  ← MODIFIER (nouvelles dépendances)
```

---

## Task 1 : Foundation — Types, helpers, reducer et tests

**Files:**
- Create: `apps/web/types/editor.ts`
- Create: `apps/web/lib/cv-sections.ts`
- Create: `apps/web/lib/editor-reducer.ts`
- Create: `apps/web/lib/__tests__/cv-sections.test.ts`
- Create: `apps/web/lib/__tests__/editor-reducer.test.ts`
- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: `CvSection`, `EditorState`, `EditorAction` (utilisés par tous les composants suivants)
- Produces: `cvDataToSections(data: CvData): CvSection[]`
- Produces: `sectionsToCvData(sections: CvSection[]): Partial<CvData> & { fullName: string }`
- Produces: `editorReducer(state: EditorState, action: EditorAction): EditorState`

- [ ] **Step 1 : Installer les dépendances**

```bash
cd apps/web
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities docx nanoid playwright-chromium
npm install -D vitest
```

Attendu : `node_modules/@dnd-kit`, `node_modules/docx`, `node_modules/nanoid`, `node_modules/vitest` présents.

- [ ] **Step 2 : Ajouter script test dans `package.json`**

Modifier `apps/web/package.json`, ajouter dans `"scripts"` :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3 : Créer `vitest.config.ts`**

```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 4 : Créer `types/editor.ts`**

```typescript
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
```

- [ ] **Step 5 : Créer `lib/cv-sections.ts`**

```typescript
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
```

- [ ] **Step 6 : Créer `lib/editor-reducer.ts`**

```typescript
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
```

- [ ] **Step 7 : Écrire les tests — `lib/__tests__/cv-sections.test.ts`**

```typescript
// apps/web/lib/__tests__/cv-sections.test.ts
import { describe, it, expect } from 'vitest'
import { cvDataToSections, sectionsToCvData } from '../cv-sections'
import type { CvData } from '@/types'

const baseCvData: CvData = {
  fullName: 'Jean Dupont',
  email: 'jean@test.com',
  phone: '+229 97000000',
  fieldOfActivity: 'Développeur Full Stack',
  summary: 'Expert React et .NET',
  experience: ['Développeur chez Acme (2022-2024)'],
  formation: ['Master Informatique — UAC (2020)'],
  skills: ['React', 'TypeScript', '.NET'],
  languages: 'Français (natif), Anglais (courant)',
}

describe('cvDataToSections', () => {
  it('crée une section header avec les données personnelles', () => {
    const sections = cvDataToSections(baseCvData)
    const header = sections.find(s => s.type === 'header')
    expect(header).toBeDefined()
    if (header?.type !== 'header') return
    expect(header.fullName).toBe('Jean Dupont')
    expect(header.email).toBe('jean@test.com')
    expect(header.jobTitle).toBe('Développeur Full Stack')
  })

  it('crée une section summary', () => {
    const sections = cvDataToSections(baseCvData)
    const summary = sections.find(s => s.type === 'summary')
    expect(summary).toBeDefined()
    if (summary?.type !== 'summary') return
    expect(summary.text).toBe('Expert React et .NET')
  })

  it('convertit experience[] strings en ExperienceEntry avec description', () => {
    const sections = cvDataToSections(baseCvData)
    const exp = sections.find(s => s.type === 'experience')
    expect(exp).toBeDefined()
    if (exp?.type !== 'experience') return
    expect(exp.entries).toHaveLength(1)
    expect(exp.entries[0].description).toBe('Développeur chez Acme (2022-2024)')
    expect(exp.entries[0].title).toBe('')
  })

  it('n\'ajoute pas de section summary si data.summary est vide', () => {
    const sections = cvDataToSections({ ...baseCvData, summary: undefined })
    expect(sections.find(s => s.type === 'summary')).toBeUndefined()
  })

  it('assigne des ordres croissants', () => {
    const sections = cvDataToSections(baseCvData)
    const orders = sections.map(s => s.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })
})

describe('sectionsToCvData', () => {
  it('round-trip : cvData → sections → cvData préserve fullName et email', () => {
    const sections = cvDataToSections(baseCvData)
    const result = sectionsToCvData(sections)
    expect(result.fullName).toBe('Jean Dupont')
    expect(result.email).toBe('jean@test.com')
  })

  it('round-trip préserve skills', () => {
    const sections = cvDataToSections(baseCvData)
    const result = sectionsToCvData(sections)
    expect(result.skills).toEqual(['React', 'TypeScript', '.NET'])
  })

  it('concatène les items languages avec virgule', () => {
    const sections = cvDataToSections(baseCvData)
    const result = sectionsToCvData(sections)
    expect(result.languages).toBe('Français (natif), Anglais (courant)')
  })
})
```

- [ ] **Step 8 : Écrire les tests — `lib/__tests__/editor-reducer.test.ts`**

```typescript
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
```

- [ ] **Step 9 : Lancer les tests**

```bash
cd apps/web && npm test
```

Attendu : 13 tests passent, exit 0.

- [ ] **Step 10 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0, zéro erreur.

- [ ] **Step 11 : Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/vitest.config.ts apps/web/types/editor.ts apps/web/lib/cv-sections.ts apps/web/lib/editor-reducer.ts "apps/web/lib/__tests__/"
git commit -m "feat: ajouter types, helpers et reducer editeur visuel + tests"
```

---

## Task 2 : Composants de rendu `cv-sections/`

**Files:**
- Create: `apps/web/components/cv-sections/HeaderSectionView.tsx`
- Create: `apps/web/components/cv-sections/SummarySectionView.tsx`
- Create: `apps/web/components/cv-sections/ExperienceSectionView.tsx`
- Create: `apps/web/components/cv-sections/FormationSectionView.tsx`
- Create: `apps/web/components/cv-sections/SkillsSectionView.tsx`
- Create: `apps/web/components/cv-sections/LanguagesSectionView.tsx`

**Interfaces:**
- Consumes: types `HeaderSection`, `SummarySection`, etc. depuis `@/types/editor`
- Produces: composants purs (`props → JSX`), utilisés par `SectionBlock` (Task 3) ET par `CVFullPage` (Task 6)

- [ ] **Step 1 : Créer `HeaderSectionView.tsx`**

```tsx
// apps/web/components/cv-sections/HeaderSectionView.tsx
import type { HeaderSection } from '@/types/editor'

export default function HeaderSectionView({ section }: { section: HeaderSection }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-black tracking-tight">{section.fullName}</h1>
      {section.jobTitle && (
        <p className="text-base text-neutral-600 mt-1">{section.jobTitle}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
        {section.email && <span>{section.email}</span>}
        {section.phone && <span>{section.phone}</span>}
        {section.address && <span>{section.address}</span>}
        {section.linkedIn && <span>{section.linkedIn}</span>}
        {section.gitHub && <span>{section.gitHub}</span>}
      </div>
      <hr className="mt-3 border-neutral-300" />
    </div>
  )
}
```

- [ ] **Step 2 : Créer `SummarySectionView.tsx`**

```tsx
// apps/web/components/cv-sections/SummarySectionView.tsx
import type { SummarySection } from '@/types/editor'

export default function SummarySectionView({ section }: { section: SummarySection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Profil</h2>
      <p className="text-sm text-neutral-700 leading-relaxed">{section.text}</p>
    </div>
  )
}
```

- [ ] **Step 3 : Créer `ExperienceSectionView.tsx`**

```tsx
// apps/web/components/cv-sections/ExperienceSectionView.tsx
import type { ExperienceSection } from '@/types/editor'

export default function ExperienceSectionView({ section }: { section: ExperienceSection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
        Expériences professionnelles
      </h2>
      <div className="space-y-4">
        {section.entries.map(entry => (
          <div key={entry.id}>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-black">
                {entry.title || <span className="text-neutral-400 italic">Poste</span>}
                {entry.company && (
                  <span className="font-normal text-neutral-600"> · {entry.company}</span>
                )}
              </span>
              <span className="text-xs text-neutral-400 ml-2 shrink-0">
                {[entry.startDate, entry.endDate].filter(Boolean).join(' – ')}
              </span>
            </div>
            {entry.description && (
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{entry.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Créer `FormationSectionView.tsx`**

```tsx
// apps/web/components/cv-sections/FormationSectionView.tsx
import type { FormationSection } from '@/types/editor'

export default function FormationSectionView({ section }: { section: FormationSection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
        Formation
      </h2>
      <div className="space-y-3">
        {section.entries.map(entry => (
          <div key={entry.id}>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-black">
                {entry.degree || <span className="text-neutral-400 italic">Diplôme</span>}
                {entry.school && (
                  <span className="font-normal text-neutral-600"> · {entry.school}</span>
                )}
              </span>
              {entry.year && (
                <span className="text-xs text-neutral-400 ml-2 shrink-0">{entry.year}</span>
              )}
            </div>
            {entry.description && (
              <p className="text-xs text-neutral-600 mt-1">{entry.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Créer `SkillsSectionView.tsx`**

```tsx
// apps/web/components/cv-sections/SkillsSectionView.tsx
import type { SkillsSection } from '@/types/editor'

export default function SkillsSectionView({ section }: { section: SkillsSection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
        Compétences
      </h2>
      <div className="flex flex-wrap gap-2">
        {section.items.map((skill, i) => (
          <span
            key={i}
            className="text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6 : Créer `LanguagesSectionView.tsx`**

```tsx
// apps/web/components/cv-sections/LanguagesSectionView.tsx
import type { LanguagesSection } from '@/types/editor'

export default function LanguagesSectionView({ section }: { section: LanguagesSection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
        Langues
      </h2>
      <div className="flex flex-wrap gap-3">
        {section.items.map((lang, i) => (
          <span key={i} className="text-sm text-neutral-700">{lang}</span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 8 : Commit**

```bash
git add apps/web/components/cv-sections/
git commit -m "feat: ajouter composants de rendu cv-sections (Header, Summary, Experience, Formation, Skills, Languages)"
```

---

## Task 3 : CVPreview + SectionBlock (DnD A4)

**Files:**
- Create: `apps/web/components/editor/CVPreview.tsx`
- Create: `apps/web/components/editor/SectionBlock.tsx`

**Interfaces:**
- Consumes: `CvSection[]` depuis `@/types/editor`; `EditorAction` dispatch; composants `cv-sections/`
- Produces: `<CVPreview sections onDispatch />` — rendu A4 avec DnD, dispatch `REORDER` et `SET_ACTIVE`

- [ ] **Step 1 : Créer `SectionBlock.tsx`**

```tsx
// apps/web/components/editor/SectionBlock.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CvSection } from '@/types/editor'
import HeaderSectionView from '@/components/cv-sections/HeaderSectionView'
import SummarySectionView from '@/components/cv-sections/SummarySectionView'
import ExperienceSectionView from '@/components/cv-sections/ExperienceSectionView'
import FormationSectionView from '@/components/cv-sections/FormationSectionView'
import SkillsSectionView from '@/components/cv-sections/SkillsSectionView'
import LanguagesSectionView from '@/components/cv-sections/LanguagesSectionView'

interface SectionBlockProps {
  section: CvSection
  isActive: boolean
  onClick: () => void
  isDragDisabled?: boolean
}

function renderSection(section: CvSection) {
  switch (section.type) {
    case 'header': return <HeaderSectionView section={section} />
    case 'summary': return <SummarySectionView section={section} />
    case 'experience': return <ExperienceSectionView section={section} />
    case 'formation': return <FormationSectionView section={section} />
    case 'skills': return <SkillsSectionView section={section} />
    case 'languages': return <LanguagesSectionView section={section} />
    default: return null
  }
}

export default function SectionBlock({ section, isActive, onClick, isDragDisabled }: SectionBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: isDragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`relative group rounded-sm cursor-pointer transition-all ${
        isActive
          ? 'ring-2 ring-black ring-offset-1'
          : 'hover:ring-1 hover:ring-neutral-300 hover:ring-offset-1'
      }`}
    >
      {/* Drag handle — visible au hover, caché sur mobile */}
      {!isDragDisabled && (
        <div
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="absolute -left-6 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-neutral-600"
        >
          ⠿
        </div>
      )}
      {renderSection(section)}
    </div>
  )
}
```

- [ ] **Step 2 : Créer `CVPreview.tsx`**

```tsx
// apps/web/components/editor/CVPreview.tsx
'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { CvSection, EditorAction } from '@/types/editor'
import SectionBlock from './SectionBlock'

interface CVPreviewProps {
  sections: CvSection[]
  activeSectionId: string | null
  dispatch: React.Dispatch<EditorAction>
  isDragDisabled?: boolean
}

export default function CVPreview({ sections, activeSectionId, dispatch, isDragDisabled }: CVPreviewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sorted = [...sections].sort((a, b) => a.order - b.order)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sorted.findIndex(s => s.id === active.id)
    const newIndex = sorted.findIndex(s => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    dispatch({ type: 'REORDER', ids: reordered.map(s => s.id) })
  }

  return (
    <div
      className="bg-white shadow-2xl mx-auto"
      style={{ width: 794, minHeight: 1123, padding: '60px 72px' }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {sorted.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                isActive={section.id === activeSectionId}
                onClick={() => dispatch({ type: 'SET_ACTIVE', id: section.id })}
                isDragDisabled={isDragDisabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/components/editor/SectionBlock.tsx apps/web/components/editor/CVPreview.tsx
git commit -m "feat: ajouter CVPreview et SectionBlock avec drag-and-drop dnd-kit"
```

---

## Task 4 : SectionPanel — CRUD latéral + mobile drawer

**Files:**
- Create: `apps/web/components/editor/SectionPanel.tsx`

**Interfaces:**
- Consumes: `activeSectionId: string | null`, `sections: CvSection[]`, `dispatch: React.Dispatch<EditorAction>` depuis le contexte éditeur
- Produces: `<SectionPanel />` — formulaire CRUD pour la section active, responsive (desktop fixed panel + mobile bottom drawer)

- [ ] **Step 1 : Créer `SectionPanel.tsx`**

```tsx
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
                  value={(section as Record<string, string>)[field] ?? ''}
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
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 3 : Commit**

```bash
git add apps/web/components/editor/SectionPanel.tsx
git commit -m "feat: ajouter SectionPanel CRUD avec formulaires par type de section"
```

---

## Task 5 : CVEditor — orchestrateur, contexte, auto-save, toolbar + page edit

**Files:**
- Create: `apps/web/components/editor/CVEditor.tsx`
- Modify: `apps/web/app/(dashboard)/cv/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `EditorState`, `editorReducer` depuis `@/lib/editor-reducer`; `cvDataToSections`, `sectionsToCvData` depuis `@/lib/cv-sections`; `CVPreview`, `SectionPanel`
- Consumes: `GET ${API_URL}/api/cvs/{id}` → `{ cvData: CvData }` (token Supabase bearer)
- Consumes: `PATCH ${API_URL}/api/cvs/{id}` → body `{ title, templateKey, isPremium, cvData }` (token Supabase bearer)
- Produces: `<CVEditor cvId templateKey />` — éditeur complet avec layout responsive

- [ ] **Step 1 : Créer `CVEditor.tsx`**

```tsx
// apps/web/components/editor/CVEditor.tsx
'use client'

import { useReducer, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { editorReducer } from '@/lib/editor-reducer'
import { cvDataToSections, sectionsToCvData } from '@/lib/cv-sections'
import CVPreview from './CVPreview'
import SectionPanel from './SectionPanel'
import type { CvData } from '@/types'
import type { EditorState } from '@/types/editor'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

interface CVEditorProps {
  cvId: string
  templateKey: string
  title: string
}

async function getAuthHeader(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session ? `Bearer ${session.access_token}` : ''
}

export default function CVEditor({ cvId, templateKey, title }: CVEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved')
  const [mobileTab, setMobileTab] = useState<'preview' | 'edit'>('preview')
  const [mobileSectionList, setMobileSectionList] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [state, dispatch] = useReducer(editorReducer, {
    cvId,
    templateKey,
    sections: [],
    activeSectionId: null,
    isDirty: false,
  } satisfies EditorState)

  // Chargement initial
  useEffect(() => {
    async function load() {
      try {
        const auth = await getAuthHeader()
        const res = await fetch(`${API_URL}/api/cvs/${cvId}`, {
          headers: { Authorization: auth },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('CV non trouvé')
        const cv = await res.json()
        const cvData: CvData = cv.cvData ?? {
          fullName: cv.title ?? 'Mon CV',
          fieldOfActivity: '',
        }
        const sections = cvDataToSections(cvData)
        dispatch({ type: 'INIT_SECTIONS', sections })
      } catch {
        // sections vides, l'utilisateur commence de zéro
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [cvId])

  // Auto-save debounce 2s
  useEffect(() => {
    if (!state.isDirty) return
    setSaveStatus('dirty')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const auth = await getAuthHeader()
        const cvData = sectionsToCvData(state.sections)
        await fetch(`${API_URL}/api/cvs/${cvId}`, {
          method: 'PATCH',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cvData }),
        })
        dispatch({ type: 'MARK_SAVED' })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [state.isDirty, state.sections, cvId])

  async function exportPdf() {
    const auth = await getAuthHeader()
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvId, sections: state.sections, templateKey }),
    })
    if (!res.ok) return alert('Erreur export PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportDocx() {
    const res = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: state.sections }),
    })
    if (!res.ok) return alert('Erreur export Word')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        Chargement de l&apos;éditeur…
      </div>
    )
  }

  const saveLabel = {
    saved: '✓ Sauvegardé',
    dirty: '● Modifications non sauvegardées',
    saving: '↑ Sauvegarde…',
    error: '⚠ Erreur de sauvegarde',
  }[saveStatus]

  const saveColor = {
    saved: 'text-neutral-500',
    dirty: 'text-neutral-300',
    saving: 'text-neutral-400',
    error: 'text-red-400',
  }[saveStatus]

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950 shrink-0">
        <button
          onClick={() => router.push(`/cv/${cvId}`)}
          className="text-neutral-400 hover:text-white text-sm transition"
        >
          ← Retour
        </button>
        <span className={`text-xs ${saveColor} hidden sm:inline`}>{saveLabel}</span>
        <div className="flex gap-2">
          <button
            onClick={exportPdf}
            className="text-sm bg-white text-black font-semibold px-4 py-1.5 rounded-lg hover:bg-neutral-200 transition"
          >
            ↓ PDF
          </button>
          <button
            onClick={exportDocx}
            className="text-sm border border-neutral-700 text-white px-4 py-1.5 rounded-lg hover:border-neutral-500 transition"
          >
            ↓ Word
          </button>
        </div>
      </div>

      {/* Onglets tablet */}
      <div className="hidden sm:flex lg:hidden border-b border-neutral-800 bg-neutral-950 shrink-0">
        <button
          onClick={() => setMobileTab('preview')}
          className={`px-6 py-2 text-sm transition ${mobileTab === 'preview' ? 'text-white border-b-2 border-white' : 'text-neutral-400'}`}
        >
          Aperçu
        </button>
        <button
          onClick={() => setMobileTab('edit')}
          className={`px-6 py-2 text-sm transition ${mobileTab === 'edit' ? 'text-white border-b-2 border-white' : 'text-neutral-400'}`}
        >
          Édition
        </button>
      </div>

      {/* Layout Desktop (≥1024px) */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Preview A4 */}
        <div className="flex-1 overflow-auto bg-neutral-100 p-8">
          <CVPreview
            sections={state.sections}
            activeSectionId={state.activeSectionId}
            dispatch={dispatch}
          />
        </div>
        {/* Panneau latéral */}
        <div className="w-96 border-l border-neutral-800 bg-neutral-950 overflow-y-auto">
          <SectionPanel
            sections={state.sections}
            activeSectionId={state.activeSectionId}
            dispatch={dispatch}
          />
        </div>
      </div>

      {/* Layout Tablet (sm–lg) */}
      <div className="hidden sm:flex lg:hidden flex-1 overflow-hidden">
        {mobileTab === 'preview' ? (
          <div className="flex-1 overflow-auto bg-neutral-100 p-4 flex justify-center">
            <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center', width: 794 }}>
              <CVPreview
                sections={state.sections}
                activeSectionId={state.activeSectionId}
                dispatch={(action) => {
                  dispatch(action)
                  if (action.type === 'SET_ACTIVE') setMobileTab('edit')
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-neutral-950">
            <SectionPanel
              sections={state.sections}
              activeSectionId={state.activeSectionId}
              dispatch={dispatch}
            />
          </div>
        )}
      </div>

      {/* Layout Mobile (<sm) */}
      <div className="flex sm:hidden flex-col flex-1 overflow-hidden">
        {/* Preview zoomée lecture seule */}
        <div className="overflow-hidden bg-neutral-100 shrink-0" style={{ height: 320 }}>
          <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: 794, pointerEvents: 'none' }}>
            <CVPreview
              sections={state.sections}
              activeSectionId={null}
              dispatch={() => {}}
              isDragDisabled
            />
          </div>
        </div>
        {/* Liste des sections avec boutons ↑ ↓ */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 p-4">
          <p className="text-xs text-neutral-500 mb-3">Sections — tap pour éditer</p>
          {[...state.sections].sort((a, b) => a.order - b.order).map((section, idx, arr) => (
            <div key={section.id} className="flex items-center gap-2 mb-2">
              <button
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE', id: section.id })
                  setMobileSectionList(true)
                }}
                className="flex-1 text-left bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white hover:border-neutral-600 transition capitalize"
              >
                {section.type}
              </button>
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => {
                    const ids = arr.map(s => s.id)
                    ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
                    dispatch({ type: 'REORDER', ids })
                  }}
                  className="text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition px-1"
                >
                  ↑
                </button>
                <button
                  disabled={idx === arr.length - 1}
                  onClick={() => {
                    const ids = arr.map(s => s.id)
                    ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
                    dispatch({ type: 'REORDER', ids })
                  }}
                  className="text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition px-1"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Bottom drawer mobile */}
        {mobileSectionList && state.activeSectionId && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="bg-black/60" onClick={() => setMobileSectionList(false)} />
            <div className="bg-neutral-950 rounded-t-2xl border-t border-neutral-800 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>
              <SectionPanel
                sections={state.sections}
                activeSectionId={state.activeSectionId}
                dispatch={(action) => {
                  dispatch(action)
                  if (action.type === 'SET_ACTIVE' && action.id === null) setMobileSectionList(false)
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Modifier `app/(dashboard)/cv/[id]/edit/page.tsx`**

Remplacer le contenu du stub par :

```tsx
// apps/web/app/(dashboard)/cv/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CVEditor from '@/components/editor/CVEditor'

export default async function CvEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  const res = await fetch(`${apiUrl}/api/cvs/${id}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/dashboard')
  const cv = await res.json()

  return (
    <CVEditor
      cvId={id}
      templateKey={cv.templateKey}
      title={cv.title}
    />
  )
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 4 : Vérifier lint**

```bash
cd apps/web && npx next lint
```

Attendu : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/components/editor/CVEditor.tsx "apps/web/app/(dashboard)/cv/[id]/edit/page.tsx"
git commit -m "feat: ajouter CVEditor orchestrateur avec auto-save et layout responsive"
```

---

## Task 6 : Export PDF via Playwright

**Files:**
- Create: `apps/web/app/api/export/pdf/route.ts`

**Interfaces:**
- Consumes: `POST { cvId: string, sections: CvSection[], templateKey: string }` + header `Authorization: Bearer <token>`
- Consumes: composants `cv-sections/` via `ReactDOMServer.renderToStaticMarkup`
- Produces: `Response(pdfBuffer, { 'Content-Type': 'application/pdf' })`

- [ ] **Step 1 : Créer `app/api/export/pdf/route.ts`**

```typescript
// apps/web/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'
import type { CvSection } from '@/types/editor'
import HeaderSectionView from '@/components/cv-sections/HeaderSectionView'
import SummarySectionView from '@/components/cv-sections/SummarySectionView'
import ExperienceSectionView from '@/components/cv-sections/ExperienceSectionView'
import FormationSectionView from '@/components/cv-sections/FormationSectionView'
import SkillsSectionView from '@/components/cv-sections/SkillsSectionView'
import LanguagesSectionView from '@/components/cv-sections/LanguagesSectionView'
import React from 'react'

function renderSectionToMarkup(section: CvSection): string {
  switch (section.type) {
    case 'header': return renderToStaticMarkup(React.createElement(HeaderSectionView, { section }))
    case 'summary': return renderToStaticMarkup(React.createElement(SummarySectionView, { section }))
    case 'experience': return renderToStaticMarkup(React.createElement(ExperienceSectionView, { section }))
    case 'formation': return renderToStaticMarkup(React.createElement(FormationSectionView, { section }))
    case 'skills': return renderToStaticMarkup(React.createElement(SkillsSectionView, { section }))
    case 'languages': return renderToStaticMarkup(React.createElement(LanguagesSectionView, { section }))
    default: return ''
  }
}

const A4_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #111; background: white; }
  .page { width: 794px; min-height: 1123px; padding: 60px 72px; }
  h1 { font-size: 22px; font-weight: 700; }
  h2 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #666; margin-bottom: 8px; }
  p { line-height: 1.6; }
  hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
  .flex { display: flex; } .flex-wrap { flex-wrap: wrap; }
  .gap-2 { gap: 6px; } .gap-3 { gap: 10px; } .gap-4 { gap: 12px; }
  .space-y-4 > * + * { margin-top: 14px; }
  .space-y-3 > * + * { margin-top: 10px; }
  .mb-6 { margin-bottom: 20px; } .mb-5 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 10px; } .mb-2 { margin-bottom: 6px; } .mb-1 { margin-bottom: 4px; }
  .mt-1 { margin-top: 4px; } .mt-2 { margin-top: 6px; } .mt-3 { margin-top: 10px; }
  .text-xs { font-size: 10px; } .text-sm { font-size: 11px; } .text-base { font-size: 13px; }
  .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; }
  .text-neutral-400 { color: #9ca3af; } .text-neutral-500 { color: #6b7280; }
  .text-neutral-600 { color: #4b5563; } .text-neutral-700 { color: #374151; }
  .tracking-widest { letter-spacing: 0.1em; } .tracking-tight { letter-spacing: -0.01em; }
  .leading-relaxed { line-height: 1.65; }
  .justify-between { justify-content: space-between; } .items-baseline { align-items: baseline; }
  .shrink-0 { flex-shrink: 0; }
  .bg-neutral-100 { background: #f5f5f5; } .border-neutral-200 { border-color: #e5e7eb; }
  .rounded-full { border-radius: 9999px; } .border { border: 1px solid; }
  .px-2 { padding-left: 6px; padding-right: 6px; }
  .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
  .ml-2 { margin-left: 6px; }
`

export async function POST(req: NextRequest) {
  try {
    const { sections } = (await req.json()) as { sections: CvSection[] }
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    const sectionsHtml = sorted.map(renderSectionToMarkup).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${A4_CSS}</style>
</head>
<body>
  <div class="page">${sectionsHtml}</div>
</body>
</html>`

    const { chromium } = await import('playwright-chromium')
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cv.pdf"',
      },
    })
  } catch (err) {
    console.error('PDF export error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 3 : Commit**

```bash
git add "apps/web/app/api/export/pdf/route.ts"
git commit -m "feat: ajouter export PDF via Playwright"
```

---

## Task 7 : Export Word (.docx)

**Files:**
- Create: `apps/web/app/api/export/docx/route.ts`

**Interfaces:**
- Consumes: `POST { sections: CvSection[] }`
- Produces: `Response(docxBuffer, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })`

- [ ] **Step 1 : Créer `app/api/export/docx/route.ts`**

```typescript
// apps/web/app/api/export/docx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TableRow, TableCell, Table, WidthType,
} from 'docx'
import type { CvSection, ExperienceSection, FormationSection } from '@/types/editor'

function buildDocxChildren(sections: CvSection[]): Paragraph[] {
  const paras: Paragraph[] = []
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  for (const section of sorted) {
    switch (section.type) {
      case 'header':
        paras.push(
          new Paragraph({
            text: section.fullName,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [new TextRun({ text: section.jobTitle, color: '555555' })],
          })
        )
        const contacts = [section.email, section.phone, section.address, section.linkedIn, section.gitHub]
          .filter(Boolean)
          .join('  |  ')
        if (contacts) {
          paras.push(new Paragraph({ children: [new TextRun({ text: contacts, size: 18, color: '888888' })] }))
        }
        paras.push(new Paragraph({ text: '' }))
        break

      case 'summary':
        paras.push(
          new Paragraph({ text: 'PROFIL', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.text }),
          new Paragraph({ text: '' })
        )
        break

      case 'experience':
        paras.push(new Paragraph({ text: 'EXPÉRIENCES PROFESSIONNELLES', heading: HeadingLevel.HEADING_2 }))
        for (const entry of (section as ExperienceSection).entries) {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({ text: entry.title, bold: true }),
                entry.company ? new TextRun({ text: ` · ${entry.company}`, color: '555555' }) : new TextRun(''),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: [entry.startDate, entry.endDate].filter(Boolean).join(' – '), size: 18, color: '888888' })],
            }),
            new Paragraph({ text: entry.description }),
            new Paragraph({ text: '' })
          )
        }
        break

      case 'formation':
        paras.push(new Paragraph({ text: 'FORMATION', heading: HeadingLevel.HEADING_2 }))
        for (const entry of (section as FormationSection).entries) {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({ text: entry.degree, bold: true }),
                entry.school ? new TextRun({ text: ` · ${entry.school}`, color: '555555' }) : new TextRun(''),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: entry.year, size: 18, color: '888888' })],
            }),
            new Paragraph({ text: '' })
          )
        }
        break

      case 'skills':
        paras.push(
          new Paragraph({ text: 'COMPÉTENCES', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.items.join('  ·  ') }),
          new Paragraph({ text: '' })
        )
        break

      case 'languages':
        paras.push(
          new Paragraph({ text: 'LANGUES', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.items.join('  ·  ') }),
          new Paragraph({ text: '' })
        )
        break

      case 'interests':
        paras.push(
          new Paragraph({ text: 'CENTRES D\'INTÉRÊT', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.items.join('  ·  ') }),
          new Paragraph({ text: '' })
        )
        break

      case 'references':
        paras.push(
          new Paragraph({ text: 'RÉFÉRENCES', heading: HeadingLevel.HEADING_2 }),
          ...section.items.map(item => new Paragraph({ text: item })),
          new Paragraph({ text: '' })
        )
        break
    }
  }

  return paras
}

export async function POST(req: NextRequest) {
  try {
    const { sections } = (await req.json()) as { sections: CvSection[] }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, // ~2cm
          },
        },
        children: buildDocxChildren(sections),
      }],
      styles: {
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            run: { size: 44, bold: true, color: '111111' },
            paragraph: { spacing: { after: 120 } },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            run: { size: 18, bold: true, color: '666666', allCaps: true },
            paragraph: { spacing: { before: 280, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'dddddd' } } },
          },
        ],
      },
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="cv.docx"',
      },
    })
  } catch (err) {
    console.error('DOCX export error:', err)
    return NextResponse.json({ error: 'DOCX generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 3 : Vérifier lint**

```bash
cd apps/web && npx next lint
```

Attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add "apps/web/app/api/export/docx/route.ts"
git commit -m "feat: ajouter export Word (.docx) via librairie docx"
```
