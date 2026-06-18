// apps/web/components/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xl font-serif text-white">TheCvBuilder</span>
        <div className="flex gap-6 text-sm text-neutral-400">
          <Link href="/templates" className="hover:text-white transition">Templates</Link>
          <Link href="/tarifs" className="hover:text-white transition">Tarifs</Link>
          <Link href="/privacy" className="hover:text-white transition">Confidentialité</Link>
        </div>
        <p className="text-neutral-600 text-xs">
          © {new Date().getFullYear()} TheCvBuilder
        </p>
      </div>
    </footer>
  )
}
