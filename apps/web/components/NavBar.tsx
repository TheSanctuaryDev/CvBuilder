'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NavBar() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-serif text-amber-400">
          TheCvBuilder
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="text-neutral-400 hover:text-white transition text-sm">
            Mes CVs
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-neutral-400 hover:text-white transition"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}
