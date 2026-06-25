import type { ReferencesSection } from '@/types/editor'

export default function ReferencesSectionView({ section }: { section: ReferencesSection }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
        Références
      </h2>
      <div className="space-y-1">
        {section.items.map((item, i) => (
          <p key={i} className="text-sm text-neutral-700">{item}</p>
        ))}
      </div>
    </div>
  )
}
