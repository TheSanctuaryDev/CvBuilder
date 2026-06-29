import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BarChart2, Users, FileText, CreditCard, TrendingUp, Cpu } from 'lucide-react'

async function getStats(token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  const res = await fetch(`${apiUrl}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (res.status === 403) return null
  if (!res.ok) return null
  return res.json()
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const stats = await getStats(session.access_token)
  if (!stats) redirect('/dashboard') // pas admin

  const cards = [
    { label: 'CVs total', value: stats.totalCvs, icon: FileText, color: 'text-blue-400' },
    { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-purple-400' },
    { label: 'Paiements validés', value: stats.totalPayments, icon: CreditCard, color: 'text-green-400' },
    { label: 'Revenu total', value: `${stats.totalRevenueFcfa.toLocaleString()} FCFA`, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'CVs premium', value: stats.premiumCvs, icon: BarChart2, color: 'text-orange-400' },
    { label: 'CVs payés', value: stats.paidCvs, icon: BarChart2, color: 'text-emerald-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-serif mb-2">Tableau de bord</h1>
      <p className="text-neutral-400 text-sm mb-8">Vue globale de la plateforme</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className={`${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-neutral-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* IA active */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
        <Cpu className="w-5 h-5 text-neutral-400" />
        <div>
          <p className="text-sm text-neutral-400">Fournisseur IA actif</p>
          <p className="font-semibold capitalize">{stats.activeAiProvider}</p>
        </div>
        <a
          href="/admin/templates"
          className="ml-auto text-xs text-neutral-500 hover:text-white transition underline"
        >
          Modifier
        </a>
      </div>
    </div>
  )
}
