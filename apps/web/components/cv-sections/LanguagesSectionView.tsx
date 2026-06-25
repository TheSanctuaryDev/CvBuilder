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
