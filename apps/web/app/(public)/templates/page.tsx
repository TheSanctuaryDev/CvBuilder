// apps/web/app/(public)/templates/page.tsx
import { createClient } from '@/lib/supabase/server'
import TemplateCard from '@/components/TemplateCard'
import type { Template } from '@/types'

async function getTemplates(): Promise<Template[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  try {
    const res = await fetch(`${apiUrl}/api/templates`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function TemplatesPage() {
  const [templates, supabase] = await Promise.all([
    getTemplates(),
    createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  const free = templates.filter((t) => !t.isPremium)
  const premium = templates.filter((t) => t.isPremium)

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif mb-4">Galerie de templates</h1>
        <p className="text-neutral-400">
          {templates.length} templates disponibles — choisissez celui qui vous représente.
        </p>
      </div>

      {free.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-neutral-300">
            Gratuits <span className="text-neutral-500 text-sm font-normal ml-2">0 FCFA</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {free.map((t) => (
              <TemplateCard key={t.id} template={t} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        </section>
      )}

      {premium.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-6 text-neutral-300">
            Premium <span className="text-neutral-500 text-sm font-normal ml-2">2000 FCFA par CV</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {premium.map((t) => (
              <TemplateCard key={t.id} template={t} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        </section>
      )}

      {templates.length === 0 && (
        <p className="text-center text-neutral-500 py-20">
          Impossible de charger les templates. Vérifiez que l&apos;API est démarrée.
        </p>
      )}
    </div>
  )
}
