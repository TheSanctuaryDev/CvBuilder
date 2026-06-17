import Link from 'next/link'

export default async function CvEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <Link href={`/cv/${id}`} className="text-neutral-400 hover:text-white text-sm transition mb-6 inline-block">
        ← Retour au CV
      </Link>
      <div className="text-4xl mb-4">✏️</div>
      <h1 className="text-2xl font-serif mb-4">Modifier le CV</h1>
      <p className="text-neutral-400 text-sm mb-6">
        La modification et la régénération seront disponibles en Phase 3,
        une fois l&apos;intégration Claude AI en place.
      </p>
      <span className="inline-block bg-neutral-800 text-neutral-400 text-xs px-3 py-1 rounded-full">
        Phase 3 — Claude AI
      </span>
    </div>
  )
}
