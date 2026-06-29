import type { InterestsSection } from '@/types/editor'

export default function InterestsSectionView({ section }: { section: InterestsSection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--cv-accent-color, #6b7280)' }}>
        Centres d&apos;intérêt
      </h2>
      <div className="flex flex-wrap gap-2">
        {section.items.map((item, i) => (
          <span key={i} className="text-sm text-neutral-700">{item}</span>
        ))}
      </div>
    </div>
  )
}
