import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'

export default async function CvVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/cv/${id}`} className="inline-flex items-center gap-1 text-neutral-400 hover:text-white text-sm transition mb-6">
        <ChevronLeft className="w-4 h-4" /> Retour au CV
      </Link>
      <h1 className="text-2xl font-serif mb-8">Historique des versions</h1>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
        <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">
          L&apos;historique des versions sera disponible prochainement.
        </p>
      </div>
    </div>
  )
}
