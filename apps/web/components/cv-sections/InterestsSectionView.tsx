import type { InterestsSection } from '@/types/editor'

export default function InterestsSectionView({ section }: { section: InterestsSection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
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
