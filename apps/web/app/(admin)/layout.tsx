'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, FileText, CreditCard, Layers } from 'lucide-react'

const nav = [
  { href: '/admin', label: 'Stats', icon: BarChart2 },
  { href: '/admin/cvs', label: 'CVs', icon: FileText },
  { href: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/admin/templates', label: 'Templates & IA', icon: Layers },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-900 flex flex-col">
        <div className="px-5 py-5 border-b border-neutral-800">
          <span className="font-serif text-lg">Admin</span>
          <span className="block text-xs text-neutral-500 mt-0.5">TheCvBuilder</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:text-white transition"
          >
            ← App
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
