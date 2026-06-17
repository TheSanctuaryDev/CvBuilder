import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CvCard from '@/components/CvCard'
import Link from 'next/link'
import type { Cv } from '@/types'

async function getCvs(accessToken: string): Promise<Cv[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cvs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: { session } } = await supabase.auth.getSession()
  const cvs = session ? await getCvs(session.access_token) : []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif">Mes CVs</h1>
        <Link
          href="/cv/nouveau"
          className="bg-amber-400 text-black font-semibold rounded-lg px-5 py-2.5 hover:bg-amber-300 transition"
        >
          + Nouveau CV
        </Link>
      </div>

      {cvs.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <p className="text-lg mb-4">Vous n&apos;avez pas encore de CV.</p>
          <Link href="/cv/nouveau" className="text-amber-400 hover:underline">
            Créer votre premier CV →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map(cv => <CvCard key={cv.id} cv={cv} />)}
        </div>
      )}
    </div>
  )
}
