// apps/web/components/cv-sections/SummarySectionView.tsx
import type { SummarySection } from '@/types/editor'
import { sanitizeRichText } from '@/lib/sanitize'

export default function SummarySectionView({ section }: { section: SummarySection }) {
  const isHtml = section.text.trimStart().startsWith('<')

  return (
    <div className="mb-5">
      <h2
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: 'var(--cv-accent-color, #6b7280)', textAlign: section.textAlign ?? 'left' }}
      >
        Profil
      </h2>
      {isHtml ? (
        <div
          className="cv-rich-text text-sm text-neutral-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(section.text) }}
        />
      ) : (
        <p className="text-sm text-neutral-700 leading-relaxed">{section.text}</p>
      )}
    </div>
  )
}
