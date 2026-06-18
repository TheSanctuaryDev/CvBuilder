// apps/web/components/TemplateCard.tsx
import Link from 'next/link'
import type { Template } from '@/types'

interface TemplateCardProps {
  template: Template
  isAuthenticated: boolean
}

export default function TemplateCard({ template, isAuthenticated }: TemplateCardProps) {
  const href = isAuthenticated
    ? `/cv/nouveau?template=${template.templateKey}`
    : `/login?redirect=/cv/nouveau?template=${template.templateKey}`

  return (
    <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-600 transition group">
      {/* Preview */}
      <div className="aspect-[3/4] bg-neutral-800 flex items-center justify-center relative">
        {template.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.previewUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-neutral-600 text-sm">Aperçu non disponible</span>
        )}
        {template.isPremium && (
          <span className="absolute top-3 right-3 bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full">
            PREMIUM
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-sm">{template.name}</h3>
          <span className="text-white text-sm font-semibold">
            {template.isPremium ? '2000 FCFA' : 'Gratuit'}
          </span>
        </div>
        <Link
          href={href}
          className="block w-full text-center bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-neutral-200 transition"
        >
          Utiliser ce template
        </Link>
      </div>
    </div>
  )
}
