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
import InterestsSectionView from '@/components/cv-sections/InterestsSectionView'
import ReferencesSectionView from '@/components/cv-sections/ReferencesSectionView'

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
    case 'interests': return <InterestsSectionView section={section} />
    case 'references': return <ReferencesSectionView section={section} />
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
