import NavBar from '@/components/NavBar'
import { createClient } from '@/lib/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

async function checkIsAdmin(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  // getUser() valide le JWT côté Supabase (cohérent avec BUG-25)
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = session && user ? await checkIsAdmin(session.access_token) : false

  return (
    <div className="min-h-screen">
      <NavBar userEmail={session?.user.email} isAdmin={isAdmin} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
