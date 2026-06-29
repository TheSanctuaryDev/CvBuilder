// apps/web/components/cv-sections/SummarySectionView.tsx
import type { SummarySection } from '@/types/editor'

export default function SummarySectionView({ section }: { section: SummarySection }) {
  return (
    <div className="mb-5">
      <h2
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: 'var(--cv-accent-color, #6b7280)' }}
      >
        Profil
      </h2>
      <p className="text-sm text-neutral-700 leading-relaxed">{section.text}</p>
    </div>
  )
}
