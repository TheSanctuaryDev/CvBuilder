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
