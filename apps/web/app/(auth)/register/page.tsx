'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText } from 'lucide-react'

function safeReturnTo(param: string | null): string {
  if (!param) return '/dashboard'
  // Autoriser uniquement les chemins relatifs internes (pas d'open redirect)
  if (param.startsWith('/') && !param.startsWith('//')) return param
  return '/dashboard'
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const fromWizard = returnTo === '/cv/nouveau'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Email de bienvenue — fire-and-forget, non bloquant
    fetch('/api/emails/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullName }),
    }).catch(() => {})

    router.push(returnTo)
    router.refresh()
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
      {fromWizard && (
        <div className="flex items-start gap-3 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 mb-6">
          <FileText className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-300">
            Votre CV est prêt. Créez un compte pour le finaliser — vous serez automatiquement redirigé.
          </p>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-6">Créer un compte</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Nom complet</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-neutral-200 disabled:opacity-50 transition"
        >
          {loading ? 'Création...' : "Créer mon compte"}
        </button>
      </form>

      <p className="text-center text-neutral-400 text-sm mt-6">
        Déjà un compte ?{' '}
        <Link
          href={`/login${returnTo !== '/dashboard' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
          className="text-white hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
