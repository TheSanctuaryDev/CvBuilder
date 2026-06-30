// apps/web/components/cv-sections/CustomSectionView.tsx
import type { CustomSection } from '@/types/editor'
import { sanitizeRichText } from '@/lib/sanitize'

export default function CustomSectionView({ section }: { section: CustomSection }) {
  const contentIsHtml = section.content?.trimStart().startsWith('<')

  return (
    <div className="mb-5">
      <h2
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{
          color: 'var(--cv-accent-color, #6b7280)',
          textAlign: section.textAlign ?? 'left',
        }}
      >
        {section.title || 'Section personnalisée'}
      </h2>
      {section.content && (
        contentIsHtml ? (
          <div
            className="cv-rich-text text-sm text-neutral-700 leading-relaxed"
            style={{ textAlign: section.textAlign ?? 'left' }}
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(section.content) }}
          />
        ) : (
          <p className="text-sm text-neutral-700 leading-relaxed" style={{ textAlign: section.textAlign ?? 'left' }}>
            {section.content}
          </p>
        )
      )}
    </div>
  )
}
