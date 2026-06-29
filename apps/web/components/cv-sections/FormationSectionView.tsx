// apps/web/components/cv-sections/FormationSectionView.tsx
import type { FormationSection } from '@/types/editor'

export default function FormationSectionView({ section }: { section: FormationSection }) {
  return (
    <div className="mb-5">
      <h2
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--cv-accent-color, #6b7280)' }}
      >
        Formation
      </h2>
      <div className="space-y-3">
        {section.entries.map(entry => (
          <div key={entry.id}>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-black">
                {entry.degree || <span className="text-neutral-400 italic">Diplôme</span>}
                {entry.school && (
                  <span className="font-normal" style={{ color: 'var(--cv-accent-color, #4b5563)' }}> · {entry.school}</span>
                )}
              </span>
              {entry.year && (
                <span className="text-xs text-neutral-400 ml-2 shrink-0">{entry.year}</span>
              )}
            </div>
            {entry.description && (
              <p className="text-xs text-neutral-600 mt-1">{entry.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
