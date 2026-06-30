'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart2, FileText, CreditCard, Layers, Menu, X } from 'lucide-react'

const nav = [
  { href: '/admin', label: 'Stats', icon: BarChart2 },
  { href: '/admin/cvs', label: 'CVs', icon: FileText },
  { href: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/admin/templates', label: 'Templates & IA', icon: Layers },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <span className="font-serif text-lg">Admin</span>
          <span className="block text-xs text-neutral-500 mt-0.5">TheCvBuilder</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                active ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-neutral-800">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:text-white transition"
        >
          ← App
        </Link>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-neutral-400 hover:text-white transition"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-serif text-base">Admin</span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 shrink-0 border-r border-neutral-800 bg-neutral-900 flex-col min-h-screen">
        <Sidebar />
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
