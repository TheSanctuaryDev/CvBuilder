// apps/web/components/cv-sections/HeaderSectionView.tsx
import type { HeaderSection } from '@/types/editor'

export default function HeaderSectionView({ section }: { section: HeaderSection }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-black tracking-tight">{section.fullName}</h1>
      {section.jobTitle && (
        <p className="text-base text-neutral-600 mt-1">{section.jobTitle}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
        {section.emails?.filter(Boolean).map((e, i) => <span key={i}>{e}</span>)}
        {section.phones?.filter(p => p.number).map((p, i) => (
          <span key={i}>{p.indicatif} {p.number}</span>
        ))}
        {section.address && <span>{section.address}</span>}
        {section.linkedIn && <span>{section.linkedIn}</span>}
        {section.gitHub && <span>{section.gitHub}</span>}
      </div>
      <hr className="mt-3 border-neutral-300" />
    </div>
  )
}
