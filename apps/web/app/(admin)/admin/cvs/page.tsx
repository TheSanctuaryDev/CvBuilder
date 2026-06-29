import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getCvs(token: string, page: number) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  const res = await fetch(`${apiUrl}/api/admin/cvs?page=${page}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (res.status === 403) return null
  if (!res.ok) return []
  return res.json()
}

export default async function AdminCvsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const cvs = await getCvs(session.access_token, page)
  if (!cvs) redirect('/dashboard')

  return (
    <div>
      <h1 className="text-2xl font-serif mb-6">CVs</h1>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400">
              <th className="text-left px-4 py-3 font-medium">Titre</th>
              <th className="text-left px-4 py-3 font-medium">Template</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {cvs.length === 0 && (
              <tr><td colSpan={5} className="text-center text-neutral-500 py-8">Aucun CV</td></tr>
            )}
            {cvs.map((cv: { id: string; title: string; templateKey: string; isPremium: boolean; isPaid: boolean; createdAt: string }) => (
              <tr key={cv.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition">
                <td className="px-4 py-3 font-medium truncate max-w-[200px]">{cv.title}</td>
                <td className="px-4 py-3 text-neutral-400">{cv.templateKey}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${cv.isPremium ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-700 text-neutral-300'}`}>
                    {cv.isPremium ? 'Premium' : 'Gratuit'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${cv.isPaid ? 'bg-green-500/20 text-green-400' : cv.isPremium ? 'bg-red-500/20 text-red-400' : 'bg-neutral-700 text-neutral-400'}`}>
                    {cv.isPaid ? 'Payé' : cv.isPremium ? 'Impayé' : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(cv.createdAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        {page > 1 && (
          <Link href={`?page=${page - 1}`} className="text-sm text-neutral-400 hover:text-white transition">← Précédent</Link>
        )}
        {cvs.length === 20 && (
          <Link href={`?page=${page + 1}`} className="text-sm text-neutral-400 hover:text-white transition">Suivant →</Link>
        )}
      </div>
    </div>
  )
}
