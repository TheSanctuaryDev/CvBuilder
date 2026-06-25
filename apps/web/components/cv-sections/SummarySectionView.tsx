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
