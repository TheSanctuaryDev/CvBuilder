'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavBarProps {
  userEmail?: string
}

export default function NavBar({ userEmail }: NavBarProps) {
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
          {userEmail && (
            <span className="text-xs text-neutral-500">
              {userEmail}
            </span>
          )}
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
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
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
