import Link from 'next/link'

export default async function CvVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/cv/${id}`} className="text-neutral-400 hover:text-white text-sm transition mb-6 inline-block">
        ← Retour au CV
      </Link>
      <h1 className="text-2xl font-serif mb-8">Historique des versions</h1>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
        <div className="text-3xl mb-3">🕐</div>
        <p className="text-neutral-400 text-sm">
          L&apos;historique des versions sera disponible après la première génération IA (Phase 3).
        </p>
      </div>
    </div>
  )
}
