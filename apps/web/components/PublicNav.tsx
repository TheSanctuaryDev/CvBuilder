'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-serif text-white">
          TheCvBuilder
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex gap-2 items-center">
          <Link href="/templates" className="text-neutral-400 hover:text-white transition text-sm px-3 py-1">
            Templates
          </Link>
          <Link href="/tarifs" className="text-neutral-400 hover:text-white transition text-sm px-3 py-1">
            Tarifs
          </Link>
          <Link href="/login" className="text-neutral-400 hover:text-white transition text-sm px-3 py-1">
            Connexion
          </Link>
          <Link href="/register" className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition">
            Commencer
          </Link>
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
          <Link href="/templates" onClick={() => setOpen(false)} className="text-neutral-300 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            Templates
          </Link>
          <Link href="/tarifs" onClick={() => setOpen(false)} className="text-neutral-300 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            Tarifs
          </Link>
          <Link href="/login" onClick={() => setOpen(false)} className="text-neutral-300 hover:text-white text-sm px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition">
            Connexion
          </Link>
          <Link href="/register" onClick={() => setOpen(false)} className="mt-2 text-center bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-neutral-200 transition">
            Commencer gratuitement
          </Link>
        </div>
      )}
    </nav>
  )
}
