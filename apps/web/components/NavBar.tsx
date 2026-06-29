'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Menu, X as XIcon, ShieldCheck } from 'lucide-react'

interface NavBarProps {
  userEmail?: string
  isAdmin?: boolean
}

export default function NavBar({ userEmail, isAdmin }: NavBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-serif text-white">
          TheCvBuilder
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex gap-4 items-center">
          <Link href="/dashboard" className="text-neutral-400 hover:text-white transition text-sm">
            Mes CVs
          </Link>
          <Link href="/cv/nouveau" className="bg-white text-black text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-neutral-200 transition">
            + Nouveau CV
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-neutral-400 hover:text-white transition" title="Admin">
              <ShieldCheck className="w-4 h-4" />
            </Link>
          )}
          <Link href="/settings" className="text-neutral-400 hover:text-white transition" title={userEmail ?? 'Paramètres'}>
            <Settings className="w-4 h-4" />
          </Link>
          <button onClick={handleLogout} className="text-sm text-neutral-400 hover:text-white transition">
            Déconnexion
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden text-neutral-400 hover:text-white transition p-1"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-950 px-4 py-4 flex flex-col gap-1">
          {userEmail && (
            <p className="text-xs text-neutral-500 px-3 pb-2">{userEmail}</p>
          )}
          <Link href="/dashboard" onClick={() => setOpen(false)} className="text-neutral-300 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            Mes CVs
          </Link>
          <Link href="/cv/nouveau" onClick={() => setOpen(false)} className="text-center bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-neutral-200 transition">
            + Nouveau CV
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="text-neutral-300 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition">
              Admin
            </Link>
          )}
          <Link href="/settings" onClick={() => setOpen(false)} className="text-neutral-300 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            Paramètres
          </Link>
          <button
            onClick={() => { setOpen(false); handleLogout() }}
            className="text-left text-neutral-300 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition"
          >
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}
