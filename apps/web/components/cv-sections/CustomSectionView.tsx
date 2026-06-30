// apps/web/components/cv-sections/CustomSectionView.tsx
import type { CustomSection } from '@/types/editor'
import { sanitizeRichText } from '@/lib/sanitize'

export default function CustomSectionView({ section }: { section: CustomSection }) {
  const contentIsHtml = section.content?.trimStart().startsWith('<')

  return (
    <div className="mb-5">
      <h2
        className="mb-2"
        style={{
          color:         section.titleStyle?.color ?? 'var(--cv-accent-color, #6b7280)',
          textAlign:     section.titleStyle?.textAlign ?? section.textAlign ?? 'left',
          fontSize:      section.titleStyle?.fontSize ? `${section.titleStyle.fontSize}px` : '0.75rem',
          fontWeight:    section.titleStyle?.fontWeight === 'semibold' ? 600 : section.titleStyle?.fontWeight === 'normal' ? 400 : 700,
          fontStyle:     section.titleStyle?.fontStyle ?? 'normal',
          textTransform: section.titleStyle?.textTransform ?? 'uppercase',
          letterSpacing: section.titleStyle?.letterSpacing === 'tight' ? '-0.025em' : section.titleStyle?.letterSpacing === 'wide' ? '0.05em' : section.titleStyle?.letterSpacing === 'normal' ? 'normal' : '0.1em',
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
