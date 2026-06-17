// apps/web/components/PublicNav.tsx
import Link from 'next/link'

export default function PublicNav() {
  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-serif text-amber-400">
          TheCvBuilder
        </Link>
        <div className="flex gap-2 items-center">
          <Link
            href="/templates"
            className="text-neutral-400 hover:text-white transition text-sm px-3 py-1"
          >
            Templates
          </Link>
          <Link
            href="/tarifs"
            className="text-neutral-400 hover:text-white transition text-sm px-3 py-1"
          >
            Tarifs
          </Link>
          <Link
            href="/login"
            className="text-neutral-400 hover:text-white transition text-sm px-3 py-1"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="bg-amber-400 text-neutral-950 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-300 transition"
          >
            Commencer
          </Link>
        </div>
      </div>
    </nav>
  )
}
