// apps/web/components/cv-sections/ExperienceSectionView.tsx
import type { ExperienceSection } from '@/types/editor'

export default function ExperienceSectionView({ section }: { section: ExperienceSection }) {
  return (
    <div className="mb-5">
      <h2
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--cv-accent-color, #6b7280)' }}
      >
        Expériences professionnelles
      </h2>
      <div className="space-y-4">
        {section.entries.map(entry => (
          <div key={entry.id}>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-black">
                {entry.title || <span className="text-neutral-400 italic">Poste</span>}
                {entry.company && (
                  <span className="font-normal" style={{ color: 'var(--cv-accent-color, #4b5563)' }}>
                    {' '}· {entry.company}
                  </span>
                )}
                {entry.location && (
                  <span className="font-normal text-xs" style={{ color: 'var(--cv-accent-color, #9ca3af)' }}>
                    {' '}· {entry.location}
                  </span>
                )}
              </span>
              <span className="text-xs text-neutral-400 ml-2 shrink-0">
                {[entry.startDate, entry.endDate].filter(Boolean).join(' – ')}
              </span>
            </div>
            {entry.description && (
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{entry.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
