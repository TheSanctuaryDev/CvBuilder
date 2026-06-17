import type { Cv } from '@/types'
import Link from 'next/link'

export default function CvCard({ cv }: { cv: Cv }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-white truncate">{cv.title}</h3>
        {cv.isPremium && (
          <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full px-2 py-0.5 ml-2 shrink-0">
            Premium
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-500 mb-1">Template : {cv.templateKey}</p>
      <p className="text-xs text-neutral-500 mb-4">
        {new Date(cv.updatedAt).toLocaleDateString('fr-FR')}
      </p>

      <div className="flex gap-2">
        <Link
          href={`/cv/${cv.id}`}
          className="flex-1 text-center text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 transition"
        >
          Voir
        </Link>
        <Link
          href={`/cv/${cv.id}/edit`}
          className="flex-1 text-center text-sm bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 rounded-lg px-3 py-2 transition"
        >
          Modifier
        </Link>
      </div>
    </div>
  )
}
