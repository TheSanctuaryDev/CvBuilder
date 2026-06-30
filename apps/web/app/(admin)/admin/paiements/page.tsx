import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getPayments(token: string, page: number) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  const res = await fetch(`${apiUrl}/api/admin/payments?page=${page}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (res.status === 403) return null
  if (!res.ok) return []
  return res.json()
}

export default async function AdminPaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const payments = await getPayments(session.access_token, page)
  if (!payments) redirect('/dashboard')

  const statusBadge = (s: string) => {
    if (s === 'success') return 'bg-green-500/20 text-green-400'
    if (s === 'pending') return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  return (
    <div>
      <h1 className="text-2xl font-serif mb-6">Paiements</h1>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-120">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400">
              <th className="text-left px-4 py-3 font-medium">Montant</th>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={4} className="text-center text-neutral-500 py-8">Aucun paiement</td></tr>
            )}
            {payments.map((p: { id: string; amount: number; currency: string; provider: string; status: string; createdAt: string }) => (
              <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition">
                <td className="px-4 py-3 font-semibold">{p.amount.toLocaleString()} {p.currency}</td>
                <td className="px-4 py-3 text-neutral-400 capitalize">{p.provider}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(p.createdAt))}
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
        {payments.length === 20 && (
          <Link href={`?page=${page + 1}`} className="text-sm text-neutral-400 hover:text-white transition">Suivant →</Link>
        )}
      </div>
    </div>
  )
}
