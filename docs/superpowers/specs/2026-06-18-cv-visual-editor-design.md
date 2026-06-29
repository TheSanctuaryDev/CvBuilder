# TheCvBuilder v2 — Éditeur Visuel CV (Phase 3b)

**Date :** 2026-06-18
**Auteur :** TheSanctuaryDev
**Statut :** Approuvé

---

## Contexte

Phase 3 du plan v2. La génération Claude AI (Phase 3a) produit un `CvData` enrichi + un `htmlContent` de référence. Cette phase ajoute un éditeur visuel interactif (style Canva) sur `/cv/[id]/edit` permettant à l'utilisateur de retoucher le CV généré, puis d'exporter en PDF ou Word.

**Approche retenue :** JSON → Composants React → HTML. Le JSON (`CvSection[]`) est la source de vérité unique. Le HTML n'est produit qu'à l'export.

---

## Stack et dépendances nouvelles

| Package | Usage |
|---------|-------|
| `@dnd-kit/core` | Drag & drop des sections |
| `@dnd-kit/sortable` | Sortable context pour le réordonnancement |
| `@dnd-kit/utilities` | Helpers DnD |
| `docx` | Génération fichier Word (.docx) |
| `nanoid` | Génération d'IDs pour les entrées CRUD |
| `playwright-chromium` | Export PDF WYSIWYG côté Next.js |

```bash
cd apps/web
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities docx nanoid playwright-chromium
```

---

## Modèle de données

### `types/editor.ts` — nouveau fichier

```typescript
export type SectionType =
  | 'header' | 'summary' | 'experience' | 'formation'
  | 'skills' | 'languages' | 'interests' | 'references'

export type HeaderSection = {
  id: string; type: 'header'; order: number
  fullName: string; jobTitle: string
  email?: string; phone?: string; address?: string
  linkedIn?: string; gitHub?: string
}

export type ExperienceEntry = {
  id: string; title: string; company: string
  startDate: string; endDate: string; description: string
}

export type FormationEntry = {
  id: string; degree: string; school: string
  year: string; description?: string
}

export type SummarySection   = { id: string; type: 'summary';    order: number; text: string }
export type ExperienceSection = { id: string; type: 'experience'; order: number; entries: ExperienceEntry[] }
export type FormationSection  = { id: string; type: 'formation';  order: number; entries: FormationEntry[] }
export type SkillsSection     = { id: string; type: 'skills';     order: number; items: string[] }
export type LanguagesSection  = { id: string; type: 'languages';  order: number; items: string[] }
export type InterestsSection  = { id: string; type: 'interests';  order: number; items: string[] }
export type ReferencesSection = { id: string; type: 'references'; order: number; items: string[] }

export type CvSection =
  | HeaderSection | SummarySection | ExperienceSection
  | FormationSection | SkillsSection | LanguagesSection
  | InterestsSection | ReferencesSection

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
```

### Helpers de conversion (`lib/cv-sections.ts`)

- `cvDataToSections(data: CvData): CvSection[]` — convertit le format DB plat vers les objets structurés. Les strings `experience[]` existantes deviennent des `ExperienceEntry` avec la string complète dans le champ `description` et les champs `title`, `company`, `startDate`, `endDate` laissés vides — l'utilisateur les complète dans l'éditeur.
- `sectionsToCvData(sections: CvSection[]): CvData` — inverse, pour sauvegarder en DB via l'API .NET existante. Pas de breaking change sur l'API.

---

## Architecture des composants

### Structure fichiers

```
apps/web/
├── app/(dashboard)/cv/[id]/edit/page.tsx     ← shell client, remplace le stub
├── components/editor/
│   ├── CVEditor.tsx          ← orchestrateur, EditorProvider, toolbar
│   ├── CVPreview.tsx         ← rendu A4, DndContext, SortableContext
│   ├── SectionBlock.tsx      ← wrapper useSortable + onClick
│   └── SectionPanel.tsx      ← panneau CRUD latéral / bottom drawer mobile
├── components/cv-sections/   ← rendus visuels purs (pas de state)
│   ├── HeaderSection.tsx
│   ├── SummarySection.tsx
│   ├── ExperienceSection.tsx
│   ├── FormationSection.tsx
│   ├── SkillsSection.tsx
│   └── LanguagesSection.tsx
├── app/api/export/
│   ├── pdf/route.ts          ← Playwright PDF
│   └── docx/route.ts         ← docx lib Word
└── types/editor.ts           ← types ci-dessus
```

### `CVEditor.tsx`

Client component. Charge le CV via `GET /api/cvs/{id}`, initialise `useReducer(editorReducer, initialState)`, fournit le context via `EditorProvider`. Gère la sauvegarde auto (debounce 2s, `PATCH /api/cvs/{id}` via `sectionsToCvData()`).

**Toolbar :**
- Desktop : `[● Modifications non sauvegardées]` / `[✓ Sauvegardé]` + `[Exporter PDF]` + `[Exporter Word]`
- Mobile : bouton flottant FAB avec menu

### `CVPreview.tsx`

Reçoit `sections: CvSection[]`. Conteneur A4 fixe (794px × min 1123px, `bg-white shadow-xl`). Wrape les sections dans `DndContext` + `SortableContext`. Dispatch `REORDER` sur `onDragEnd`.

**Responsive preview :**
- Desktop : taille réelle 794px
- Tablet : `transform: scale(0.65) origin-top-center`
- Mobile : `transform: scale(0.38) origin-top-center`, lecture seule

### `SectionBlock.tsx`

`useSortable` de `@dnd-kit/sortable`. Au survol : border `border-neutral-300` + handle drag `⠿` en top-left. Au clic : `dispatch SET_ACTIVE`. Rend le composant visuel correspondant au `section.type`.

### `SectionPanel.tsx`

Affiché quand `activeSectionId !== null`. Adaptatif :
- Desktop/Tablet : panneau fixe à droite (largeur ~380px)
- Mobile : `bottom drawer` (modal qui monte du bas, hauteur 70vh, scroll interne)

Contenu selon `section.type` :
- **header** : champs texte pour fullName, jobTitle, email, phone, address, linkedIn, gitHub
- **summary** : textarea
- **experience** : liste d'`ExperienceEntry` avec champs title/company/dates/description + boutons `+ Ajouter` / `✕`
- **formation** : liste de `FormationEntry` avec degree/school/year/description
- **skills / languages / interests / references** : liste de strings avec `+ Ajouter` / `✕`

Bouton `Supprimer la section` en bas du panneau (rouge, confirm dialog natif).

### `cv-sections/` — composants de rendu pur

Chaque composant reçoit uniquement les données de sa section et retourne du JSX styléen Tailwind (noir & blanc, typo propre). Ces mêmes composants sont utilisés :
1. Dans `CVPreview` (affichage éditeur)
2. Dans `/api/export/pdf` (via `ReactDOMServer.renderToStaticMarkup`)

---

## Responsive layout

### Desktop (≥ 1024px)
```
┌─────────────────────────────────────────────────────────────┐
│ NavBar                    [✓ Sauvegardé] [↓ PDF] [↓ Word]  │
├───────────────────────────────┬─────────────────────────────┤
│   CVPreview (794px A4)        │   SectionPanel              │
│   ← sections draggables       │   (édition section active)  │
│   ← hover = border + handle   │   ~380px fixe              │
└───────────────────────────────┴─────────────────────────────┘
```

### Tablet (768px–1023px)
```
[Onglet: Aperçu] [Onglet: Édition]
→ Aperçu : preview zoomée à 65%
→ Édition : SectionPanel pleine largeur
```

### Mobile (< 768px)
```
┌─────────────────────────┐
│  Preview zoomée 38%     │  (lecture seule)
├─────────────────────────┤
│  ▼ En-tête        ↑ ↓  │
│  ▼ Résumé         ↑ ↓  │  ← tap → bottom drawer
│  ▼ Expérience     ↑ ↓  │
│  ▼ Formation      ↑ ↓  │
│  ▼ Compétences    ↑ ↓  │
└─────────────────────────┘
         [FAB ↓]
```
DnD remplacé par boutons ↑ ↓ sur mobile.

---

## Pipeline d'export

### PDF — `app/api/export/pdf/route.ts`

```
POST { cvId, sections, templateKey }
  → ReactDOMServer.renderToStaticMarkup(<CVFullPage sections={sections} />)
  → HTML string + CSS A4 inline
  → playwright.chromium.launch()
  → page.setContent(html)
  → page.pdf({ format: 'A4', printBackground: true })
  → Response(buffer, 'application/pdf')
```

`CVFullPage` est un composant serveur qui assemble tous les `cv-sections/` sans les wrappers éditeur (pas de border de hover, pas de handles DnD).

### Word — `app/api/export/docx/route.ts`

```
POST { sections }
  → buildDocxBlocks(sections) → docx Paragraph[]
  → new Document({ sections: [{ children }] })
  → Packer.toBuffer(doc)
  → Response(buffer, 'application/vnd.openxmlformats-...')
```

Mapping sections → docx :
- `HeaderSection` → `Heading1` + runs contact
- `SummarySection` → `Paragraph`
- `ExperienceSection` → par entry : `Heading2` (titre @ entreprise) + `Paragraph` (dates) + `Paragraph` (description)
- `FormationSection` → même pattern
- `SkillsSection` → `BulletList`

---

## Gestion d'état — `editorReducer`

```typescript
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_ACTIVE': return { ...state, activeSectionId: action.id }
    case 'UPDATE_SECTION': return {
      ...state, isDirty: true,
      sections: state.sections.map(s => s.id === action.section.id ? action.section : s)
    }
    case 'DELETE_SECTION': return {
      ...state, isDirty: true, activeSectionId: null,
      sections: state.sections.filter(s => s.id !== action.id)
    }
    case 'REORDER': return {
      ...state, isDirty: true,
      sections: action.ids.map((id, i) => ({
        ...state.sections.find(s => s.id === id)!, order: i
      }))
    }
    case 'MARK_SAVED': return { ...state, isDirty: false }
    // ADD_ENTRY, DELETE_ENTRY : mutation immutable de la section cible
  }
}
```

---

## Intégration Phase 3a (Claude AI)

`GenerateController` (.NET) retourne :
```json
{
  "cvData": { /* CvData enrichi */ },
  "htmlContent": "<!-- HTML référence visuelle -->"
}
```

Sur `/cv/[id]/edit` :
1. Si `CvVersion` existe : `cvDataToSections(cvVersion.cvData)` → EditorState
2. Si pas de version : bouton "Générer avec Claude" (appelle GenerateController puis recharge)
3. `htmlContent` est stocké dans `CvVersion` mais n'est pas utilisé par l'éditeur (référence uniquement)

---

## Flux complet utilisateur

```
1. Formulaire multi-steps → createCv()
2. /cv/[id] → bouton "Générer avec l'IA" → GenerateController
3. Claude → CvData enrichi → cvDataToSections() → EditorState
4. /cv/[id]/edit → éditeur visuel
   ├── Drag & drop sections
   ├── Clic section → SectionPanel → édition CRUD
   └── Modifications → debounce → PATCH /api/cvs/{id}
5. "Exporter PDF" → POST /api/export/pdf → téléchargement
6. "Exporter Word" → POST /api/export/docx → téléchargement
```
