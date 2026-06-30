# TheCvBuilder v2 — Phase 2 Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire toutes les pages Next.js 15 publiques et authentifiées (landing, templates, tarifs, privacy, formulaire CV multi-steps, détail CV, edit stub, versions stub).

**Architecture:** Pages publiques dans `app/(public)/` avec `PublicNav` + `Footer`. Pages dashboard dans `app/(dashboard)/` avec `NavBar` existant. `app/page.tsx` devient la landing page (non plus une redirection). Formulaire CV multi-steps côté client collecte les données et crée l'entrée CV via `POST /api/cvs`. Les endpoints génération/paiement (Phase 3) sont représentés par des stubs UI.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, `@supabase/ssr`, `@supabase/supabase-js`, fetch natif vers le .NET API.

## Global Constraints

- Next.js 15, App Router — jamais de Pages Router
- TypeScript strict — `npx tsc --noEmit` doit passer à zéro erreur après chaque tâche
- Aucun nouveau package npm — utiliser uniquement ce qui est déjà dans `apps/web/package.json`
- Thème dark : `bg-neutral-950 text-white`, accent `amber-400`, Tailwind uniquement (pas de CSS inline)
- Server components par défaut — `'use client'` seulement si interaction (état, événements)
- Appels API serveur : `fetch(url)` direct avec token Supabase ou sans auth pour endpoints publics
- `lib/api.ts` est client-only (browser Supabase) — ne pas l'importer dans des server components
- Routes protégées : `/dashboard` et `/cv/*` déjà gérées par `middleware.ts`
- Icônes : utiliser des caractères Unicode ou SVG inline — pas de bibliothèque d'icônes
- Prix affiché : **2000 FCFA** pour les templates premium, **0 FCFA** pour les templates gratuits
- `NEXT_PUBLIC_API_URL` = URL du .NET API (par défaut `http://localhost:5000`)

## Fichiers créés / modifiés

```
apps/web/
├── app/
│   ├── page.tsx                               ← MODIFIER (landing page)
│   ├── (public)/
│   │   ├── layout.tsx                         ← CRÉER (PublicNav + Footer)
│   │   ├── templates/page.tsx                 ← CRÉER (galerie templates)
│   │   ├── tarifs/page.tsx                    ← CRÉER (pricing)
│   │   └── privacy/page.tsx                   ← CRÉER (confidentialité)
│   └── (dashboard)/
│       └── cv/
│           ├── nouveau/page.tsx               ← CRÉER (formulaire multi-steps)
│           ├── [id]/page.tsx                  ← CRÉER (détail CV)
│           ├── [id]/edit/page.tsx             ← CRÉER (stub édition)
│           └── [id]/versions/page.tsx         ← CRÉER (stub versions)
├── components/
│   ├── PublicNav.tsx                          ← CRÉER
│   ├── Footer.tsx                             ← CRÉER
│   └── TemplateCard.tsx                       ← CRÉER
└── lib/
    └── api.ts                                 ← MODIFIER (+ fetchCv)
```

---

## Task 1 : PublicNav + Footer + layout public + landing page

**Files:**
- Create: `apps/web/components/PublicNav.tsx`
- Create: `apps/web/components/Footer.tsx`
- Create: `apps/web/app/(public)/layout.tsx`
- Modify: `apps/web/app/page.tsx`

**Interfaces:**
- Produces: `PublicNav` (no props), `Footer` (no props), utilisés par `(public)/layout.tsx`
- `app/page.tsx` devient server component, lit `user` via Supabase server client pour personnaliser le CTA

- [ ] **Step 1 : Créer `components/PublicNav.tsx`**

```tsx
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
```

- [ ] **Step 2 : Créer `components/Footer.tsx`**

```tsx
// apps/web/components/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xl font-serif text-amber-400">TheCvBuilder</span>
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
```

- [ ] **Step 3 : Créer `app/(public)/layout.tsx`**

```tsx
// apps/web/app/(public)/layout.tsx
import PublicNav from '@/components/PublicNav'
import Footer from '@/components/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 4 : Réécrire `app/page.tsx` en landing page**

La page actuelle redirige tout le monde. La remplacer par une vraie landing page. Les utilisateurs connectés voient le CTA "Aller au dashboard" à la place de "Commencer gratuitement".

```tsx
// apps/web/app/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PublicNav from '@/components/PublicNav'
import Footer from '@/components/Footer'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center">
          <span className="inline-block bg-amber-400/10 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            Alimenté par Claude AI
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight mb-6">
            Votre CV professionnel<br />
            <span className="text-amber-400">en quelques minutes</span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Renseignez vos informations, choisissez un template, et notre IA génère
            un CV impeccable au format PDF — prêt à envoyer.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-amber-400 text-neutral-950 font-semibold px-8 py-3 rounded-xl hover:bg-amber-300 transition text-lg"
              >
                Mon dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-amber-400 text-neutral-950 font-semibold px-8 py-3 rounded-xl hover:bg-amber-300 transition text-lg"
                >
                  Commencer gratuitement
                </Link>
                <Link
                  href="/templates"
                  className="border border-neutral-700 text-white px-8 py-3 rounded-xl hover:border-neutral-500 transition text-lg"
                >
                  Voir les templates
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="bg-neutral-900 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-serif text-center mb-12">Comment ça marche</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Choisissez un template', desc: 'Sélectionnez parmi nos 15 templates professionnels — 2 gratuits, 13 premium.' },
                { step: '02', title: 'Renseignez vos infos', desc: 'Complétez le formulaire guidé : expériences, formation, compétences.' },
                { step: '03', title: 'Téléchargez votre PDF', desc: 'Claude AI génère votre CV en HTML optimisé, converti en PDF propre.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="text-4xl font-serif text-amber-400 mb-3">{step}</div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-neutral-400 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tarifs teaser */}
        <section className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-serif mb-4">Tarifs simples</h2>
          <p className="text-neutral-400 mb-8">Templates gratuits à 0 FCFA. Templates premium à 2000 FCFA par CV.</p>
          <Link
            href="/tarifs"
            className="border border-amber-400 text-amber-400 px-6 py-2 rounded-lg hover:bg-amber-400/10 transition"
          >
            Voir tous les tarifs
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0, zéro erreur.

- [ ] **Step 6 : Commit**

```bash
git add apps/web/components/PublicNav.tsx apps/web/components/Footer.tsx "apps/web/app/(public)/layout.tsx" apps/web/app/page.tsx
git commit -m "feat: ajouter layout public, PublicNav, Footer et landing page"
```

---

## Task 2 : Pages /templates + /tarifs + /privacy

**Files:**
- Create: `apps/web/components/TemplateCard.tsx`
- Create: `apps/web/app/(public)/templates/page.tsx`
- Create: `apps/web/app/(public)/tarifs/page.tsx`
- Create: `apps/web/app/(public)/privacy/page.tsx`

**Interfaces:**
- Consumes: `Template` type depuis `@/types`, `NEXT_PUBLIC_API_URL` pour fetch côté serveur
- `TemplateCard` props: `{ template: Template, isAuthenticated: boolean }`

- [ ] **Step 1 : Créer `components/TemplateCard.tsx`**

```tsx
// apps/web/components/TemplateCard.tsx
import Link from 'next/link'
import type { Template } from '@/types'

interface TemplateCardProps {
  template: Template
  isAuthenticated: boolean
}

export default function TemplateCard({ template, isAuthenticated }: TemplateCardProps) {
  const href = isAuthenticated
    ? `/cv/nouveau?template=${template.templateKey}`
    : `/login?redirect=/cv/nouveau?template=${template.templateKey}`

  return (
    <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-600 transition group">
      {/* Preview */}
      <div className="aspect-[3/4] bg-neutral-800 flex items-center justify-center relative">
        {template.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.previewUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-neutral-600 text-sm">Aperçu non disponible</span>
        )}
        {template.isPremium && (
          <span className="absolute top-3 right-3 bg-amber-400 text-neutral-950 text-xs font-bold px-2 py-0.5 rounded-full">
            PREMIUM
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-sm">{template.name}</h3>
          <span className="text-amber-400 text-sm font-semibold">
            {template.isPremium ? '2000 FCFA' : 'Gratuit'}
          </span>
        </div>
        <Link
          href={href}
          className="block w-full text-center bg-amber-400 text-neutral-950 text-sm font-semibold py-2 rounded-lg hover:bg-amber-300 transition"
        >
          Utiliser ce template
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer `app/(public)/templates/page.tsx`**

Ce server component appelle directement GET /api/templates (pas d'auth requise).

```tsx
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
```

- [ ] **Step 3 : Créer `app/(public)/tarifs/page.tsx`**

```tsx
// apps/web/app/(public)/tarifs/page.tsx
import Link from 'next/link'

export default function TarifsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-serif mb-4">Tarifs</h1>
        <p className="text-neutral-400 text-lg">Simple, transparent, sans abonnement.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Gratuit */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <h2 className="text-2xl font-serif mb-1">Gratuit</h2>
          <div className="text-4xl font-bold text-amber-400 my-4">0 FCFA</div>
          <p className="text-neutral-400 text-sm mb-6">Par CV généré</p>
          <ul className="space-y-3 text-sm text-neutral-300 mb-8">
            {[
              '2 templates disponibles',
              'Compte requis',
              'Téléchargement PDF',
              'Historique de vos CVs',
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-amber-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="block text-center border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Premium */}
        <div className="bg-neutral-900 border-2 border-amber-400 rounded-2xl p-8 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-neutral-950 text-xs font-bold px-4 py-1 rounded-full">
            POPULAIRE
          </span>
          <h2 className="text-2xl font-serif mb-1">Premium</h2>
          <div className="text-4xl font-bold text-amber-400 my-4">2000 FCFA</div>
          <p className="text-neutral-400 text-sm mb-6">Par CV premium généré</p>
          <ul className="space-y-3 text-sm text-neutral-300 mb-8">
            {[
              '13 templates premium exclusifs',
              'Paiement par carte ou Mobile Money',
              'Téléchargement PDF haute qualité',
              'Historique et versions',
              'Modification et régénération',
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-amber-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link
            href="/templates"
            className="block text-center bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition"
          >
            Choisir un template
          </Link>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Questions fréquentes</h2>
        <div className="space-y-4 text-left max-w-2xl mx-auto">
          {[
            {
              q: 'Dois-je payer un abonnement ?',
              a: 'Non. Vous payez uniquement par CV premium généré. Les templates gratuits sont toujours à 0 FCFA.',
            },
            {
              q: 'Quels moyens de paiement acceptez-vous ?',
              a: 'Carte bancaire internationale (Stripe) et Mobile Money MTN/Moov (FedaPay).',
            },
            {
              q: 'Puis-je modifier mon CV après l\'avoir payé ?',
              a: 'Oui. Vous pouvez modifier vos données et régénérer votre CV autant de fois que nécessaire.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
              <h3 className="font-semibold mb-2 text-sm">{q}</h3>
              <p className="text-neutral-400 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Créer `app/(public)/privacy/page.tsx`**

```tsx
// apps/web/app/(public)/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-serif mb-10">Confidentialité &amp; Contact</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Données collectées</h2>
        <p className="text-neutral-400 text-sm leading-relaxed">
          TheCvBuilder collecte uniquement les données nécessaires à la génération de votre CV :
          informations personnelles que vous saisissez (nom, email, expériences, formation),
          adresse email pour l&apos;authentification, et données de paiement traitées exclusivement
          par Stripe et FedaPay (nous ne stockons aucune donnée de carte bancaire).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Utilisation des données</h2>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Vos données sont utilisées pour générer votre CV, gérer votre compte,
          et vous envoyer des notifications transactionnelles (confirmation de paiement,
          CV prêt). Elles ne sont jamais vendues ni partagées à des tiers commerciaux.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Stockage et sécurité</h2>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Vos données sont stockées sur Supabase (PostgreSQL) avec Row Level Security activé —
          chaque utilisateur ne peut accéder qu&apos;à ses propres données. La connexion est sécurisée
          par JWT et HTTPS.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Suppression de compte</h2>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Vous pouvez demander la suppression de votre compte et de toutes vos données
          en nous contactant par email.
        </p>
      </section>

      <section className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Contact</h2>
        <p className="text-neutral-400 text-sm mb-3">
          Pour toute question concernant vos données ou pour nous contacter :
        </p>
        <a
          href="mailto:thesanctuarydev29@gmail.com"
          className="text-amber-400 hover:underline text-sm"
        >
          thesanctuarydev29@gmail.com
        </a>
      </section>
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 6 : Commit**

```bash
git add apps/web/components/TemplateCard.tsx "apps/web/app/(public)/templates/page.tsx" "apps/web/app/(public)/tarifs/page.tsx" "apps/web/app/(public)/privacy/page.tsx"
git commit -m "feat: ajouter pages templates, tarifs et privacy avec TemplateCard"
```

---

## Task 3 : Formulaire CV multi-steps (/cv/nouveau)

**Files:**
- Create: `apps/web/app/(dashboard)/cv/nouveau/page.tsx`

**Interfaces:**
- Consumes: `createCv` depuis `@/lib/api`, `fetchTemplates` depuis `@/lib/api`, `CvData` type depuis `@/types`, `Template` type depuis `@/types`
- Produces: après soumission → redirige vers `/cv/${cv.id}`

Ce composant est entièrement client (`'use client'`) car il gère l'état multi-steps.

Étapes du formulaire :
1. **Choix du template** — liste des templates depuis GET /api/templates
2. **Infos personnelles** — fullName, email, phone, address, linkedIn, gitHub, jobTitle (stocké dans fieldOfActivity)
3. **Résumé professionnel** — champ textarea pour summary
4. **Expériences** — liste d'expériences en texte libre (une par textarea, bouton +/-)
5. **Formation** — liste de formations en texte libre
6. **Compétences & Langues** — skills (liste), languages (texte libre)
7. **Confirmation** — récapitulatif + bouton "Créer le CV"

Soumission finale : `createCv({ title: data.fullName + ' — ' + selectedTemplate.name, templateKey, isPremium: selectedTemplate.isPremium })` puis `router.push('/cv/${cv.id}')`.

- [ ] **Step 1 : Créer `app/(dashboard)/cv/nouveau/page.tsx`**

```tsx
// apps/web/app/(dashboard)/cv/nouveau/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchTemplates, createCv } from '@/lib/api'
import type { Template, CvData } from '@/types'

const TOTAL_STEPS = 7

const emptyData: CvData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  linkedIn: '',
  gitHub: '',
  fieldOfActivity: '',
  summary: '',
  experience: [],
  formation: [],
  skills: [],
  languages: '',
}

export default function NouveauCvPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedKey = searchParams.get('template') ?? ''

  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedKey, setSelectedKey] = useState(preselectedKey)
  const [data, setData] = useState<CvData>(emptyData)
  const [experiences, setExperiences] = useState<string[]>([''])
  const [formations, setFormations] = useState<string[]>([''])
  const [skills, setSkills] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setError('Impossible de charger les templates.'))
  }, [])

  const selectedTemplate = templates.find((t) => t.templateKey === selectedKey)

  function set(field: keyof CvData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit() {
    if (!selectedTemplate) return
    setLoading(true)
    setError('')
    const finalData: CvData = {
      ...data,
      experience: experiences.filter(Boolean),
      formation: formations.filter(Boolean),
      skills: skills.filter(Boolean),
    }
    const title = `${finalData.fullName || 'Mon CV'} — ${selectedTemplate.name}`
    try {
      const cv = await createCv({
        title,
        templateKey: selectedTemplate.templateKey,
        isPremium: selectedTemplate.isPremium,
      })
      router.push(`/cv/${cv.id}`)
    } catch {
      setError('Erreur lors de la création du CV. Réessayez.')
      setLoading(false)
    }
  }

  const stepTitles = [
    'Template', 'Infos personnelles', 'Résumé', 'Expériences', 'Formation', 'Compétences', 'Confirmation',
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex gap-1 mb-2">
          {stepTitles.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-amber-400' : 'bg-neutral-800'}`}
            />
          ))}
        </div>
        <p className="text-sm text-neutral-400">
          Étape {step}/{TOTAL_STEPS} — <span className="text-white">{stepTitles[step - 1]}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Template */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Choisissez votre template</h2>
          {templates.length === 0 && !error && (
            <p className="text-neutral-400 text-sm">Chargement des templates…</p>
          )}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {templates.map((t) => (
              <button
                key={t.templateKey}
                onClick={() => setSelectedKey(t.templateKey)}
                className={`text-left border rounded-xl p-4 transition ${
                  selectedKey === t.templateKey
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-neutral-700 hover:border-neutral-500'
                }`}
              >
                <div className="font-semibold text-sm mb-1">{t.name}</div>
                <div className="text-xs text-amber-400">
                  {t.isPremium ? '2000 FCFA' : 'Gratuit'}
                </div>
              </button>
            ))}
          </div>
          <button
            disabled={!selectedKey}
            onClick={() => setStep(2)}
            className="w-full bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition disabled:opacity-40"
          >
            Continuer →
          </button>
        </div>
      )}

      {/* Step 2: Infos personnelles */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Informations personnelles</h2>
          <div className="space-y-4">
            {(
              [
                { label: 'Nom complet *', field: 'fullName', placeholder: 'Jean Dupont', required: true },
                { label: 'Email', field: 'email', placeholder: 'jean@exemple.com', required: false },
                { label: 'Téléphone', field: 'phone', placeholder: '+229 97000000', required: false },
                { label: 'Ville / Adresse', field: 'address', placeholder: 'Cotonou, Bénin', required: false },
                { label: 'Titre professionnel', field: 'fieldOfActivity', placeholder: 'Développeur Full Stack', required: false },
                { label: 'LinkedIn', field: 'linkedIn', placeholder: 'linkedin.com/in/jean-dupont', required: false },
                { label: 'GitHub', field: 'gitHub', placeholder: 'github.com/jean-dupont', required: false },
              ] as Array<{ label: string; field: keyof CvData; placeholder: string; required: boolean }>
            ).map(({ label, field, placeholder, required }) => (
              <div key={field}>
                <label className="block text-sm text-neutral-300 mb-1">{label}</label>
                <input
                  type="text"
                  value={(data[field] as string) ?? ''}
                  onChange={set(field)}
                  placeholder={placeholder}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
                {required && !data[field] && (
                  <p className="text-xs text-red-400 mt-1">Champ requis</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(1)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button
              disabled={!data.fullName}
              onClick={() => setStep(3)}
              className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition disabled:opacity-40"
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Résumé */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Résumé professionnel</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Présentez-vous en 3-5 phrases. L&apos;IA utilisera ce texte pour structurer votre CV.
          </p>
          <textarea
            value={data.summary ?? ''}
            onChange={set('summary')}
            placeholder="Ex : Développeur Full Stack avec 5 ans d'expérience en React et .NET…"
            rows={6}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
          />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(4)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Expériences */}
      {step === 4 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Expériences professionnelles</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Décrivez chaque expérience librement (poste, entreprise, dates, missions).
          </p>
          <div className="space-y-3">
            {experiences.map((exp, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  value={exp}
                  onChange={(e) => {
                    const next = [...experiences]
                    next[i] = e.target.value
                    setExperiences(next)
                  }}
                  placeholder={`Expérience ${i + 1} : Ex. Développeur chez Acme (2022-2024) — React, Node.js`}
                  rows={3}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
                />
                {experiences.length > 1 && (
                  <button
                    onClick={() => setExperiences(experiences.filter((_, j) => j !== i))}
                    className="text-neutral-500 hover:text-red-400 transition text-lg self-start pt-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setExperiences([...experiences, ''])}
              className="text-amber-400 text-sm hover:underline"
            >
              + Ajouter une expérience
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(3)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(5)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Formation */}
      {step === 5 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Formation</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Décrivez chaque diplôme ou formation (titre, établissement, année).
          </p>
          <div className="space-y-3">
            {formations.map((f, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  value={f}
                  onChange={(e) => {
                    const next = [...formations]
                    next[i] = e.target.value
                    setFormations(next)
                  }}
                  placeholder={`Formation ${i + 1} : Ex. Master Informatique — Université d'Abomey-Calavi (2020)`}
                  rows={2}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
                />
                {formations.length > 1 && (
                  <button
                    onClick={() => setFormations(formations.filter((_, j) => j !== i))}
                    className="text-neutral-500 hover:text-red-400 transition text-lg self-start pt-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setFormations([...formations, ''])}
              className="text-amber-400 text-sm hover:underline"
            >
              + Ajouter une formation
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(4)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(6)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Compétences & Langues */}
      {step === 6 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Compétences &amp; Langues</h2>
          <div className="mb-6">
            <label className="block text-sm text-neutral-300 mb-3">Compétences</label>
            <div className="space-y-2">
              {skills.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={s}
                    onChange={(e) => {
                      const next = [...skills]
                      next[i] = e.target.value
                      setSkills(next)
                    }}
                    placeholder={`Ex. React, TypeScript, .NET`}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  {skills.length > 1 && (
                    <button onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-red-400 transition">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setSkills([...skills, ''])} className="text-amber-400 text-sm hover:underline">
                + Ajouter une compétence
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Langues</label>
            <input
              type="text"
              value={data.languages ?? ''}
              onChange={set('languages')}
              placeholder="Ex. Français (natif), Anglais (courant)"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(5)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button onClick={() => setStep(7)} className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Confirmation */}
      {step === 7 && (
        <div>
          <h2 className="text-2xl font-serif mb-6">Confirmation</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Template</span>
              <span className="font-semibold">{selectedTemplate?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Nom</span>
              <span className="font-semibold">{data.fullName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Type</span>
              <span className={selectedTemplate?.isPremium ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
                {selectedTemplate?.isPremium ? 'Premium — 2000 FCFA' : 'Gratuit — 0 FCFA'}
              </span>
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl px-4 py-3 text-sm text-blue-300 mb-6">
            La génération IA sera disponible en Phase 3. Votre CV sera enregistré et vous pourrez le compléter plus tard.
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(6)} className="flex-1 border border-neutral-700 text-white py-3 rounded-xl hover:border-neutral-500 transition">
              ← Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !data.fullName || !selectedKey}
              className="flex-1 bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl hover:bg-amber-300 transition disabled:opacity-40"
            >
              {loading ? 'Création…' : 'Créer mon CV →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 3 : Vérifier le lint**

```bash
cd apps/web && npx next lint
```

Attendu : pas d'erreurs.

- [ ] **Step 4 : Commit**

```bash
git add "apps/web/app/(dashboard)/cv/nouveau/page.tsx"
git commit -m "feat: ajouter formulaire CV multi-steps (/cv/nouveau)"
```

---

## Task 4 : Page détail CV (/cv/[id]) + pages edit et versions

**Files:**
- Modify: `apps/web/lib/api.ts` (ajouter `fetchCv`)
- Create: `apps/web/app/(dashboard)/cv/[id]/page.tsx`
- Create: `apps/web/app/(dashboard)/cv/[id]/edit/page.tsx`
- Create: `apps/web/app/(dashboard)/cv/[id]/versions/page.tsx`

**Interfaces:**
- `fetchCv(id: string): Promise<Cv>` — appelle GET /api/cvs/{id} avec auth (client-side)
- La page `/cv/[id]` est un server component qui appelle GET /api/cvs/{id} directement avec le token Supabase

- [ ] **Step 1 : Ajouter `fetchCv` dans `lib/api.ts`**

Ajouter à la fin de `apps/web/lib/api.ts` :

```typescript
export async function fetchCv(id: string) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs/${id}`, { headers })
  if (!res.ok) throw new Error('CV non trouvé')
  return res.json() as Promise<import('@/types').Cv>
}
```

- [ ] **Step 2 : Créer `app/(dashboard)/cv/[id]/page.tsx`**

Server component qui récupère le CV depuis l'API via le token Supabase.

```tsx
// apps/web/app/(dashboard)/cv/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Cv } from '@/types'

async function getCv(id: string, token: string): Promise<Cv | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  try {
    const res = await fetch(`${apiUrl}/api/cvs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function CvDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const cv = await getCv(id, session.access_token)
  if (!cv) notFound()

  const formatted = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(cv.createdAt))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-neutral-400 hover:text-white text-sm transition mb-2 inline-block">
            ← Mes CVs
          </Link>
          <h1 className="text-3xl font-serif">{cv.title}</h1>
          <p className="text-neutral-400 text-sm mt-1">Créé le {formatted}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/cv/${cv.id}/edit`}
            className="border border-neutral-700 text-white text-sm px-4 py-2 rounded-lg hover:border-neutral-500 transition"
          >
            Modifier
          </Link>
          <Link
            href={`/cv/${cv.id}/versions`}
            className="border border-neutral-700 text-white text-sm px-4 py-2 rounded-lg hover:border-neutral-500 transition"
          >
            Versions
          </Link>
        </div>
      </div>

      {/* Infos CV */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-400 block mb-1">Template</span>
            <span className="font-semibold">{cv.templateKey}</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1">Type</span>
            <span className={cv.isPremium ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
              {cv.isPremium ? 'Premium' : 'Gratuit'}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1">Statut paiement</span>
            <span className={cv.isPaid ? 'text-green-400' : 'text-neutral-500'}>
              {cv.isPaid ? 'Payé' : cv.isPremium ? 'Non payé' : '—'}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1">Version actuelle</span>
            <span>{cv.currentVersion > 0 ? `v${cv.currentVersion}` : 'Pas encore généré'}</span>
          </div>
        </div>
      </div>

      {/* PDF preview placeholder */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6 text-center">
        <div className="text-4xl mb-3">📄</div>
        <h2 className="font-semibold mb-2">Aperçu PDF</h2>
        <p className="text-neutral-400 text-sm mb-4">
          La génération IA et l&apos;aperçu PDF seront disponibles en Phase 3.
        </p>
        <span className="inline-block bg-neutral-800 text-neutral-400 text-xs px-3 py-1 rounded-full">
          Phase 3 — Claude AI + Playwright PDF
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          disabled
          className="flex-1 bg-neutral-800 text-neutral-500 font-semibold py-3 rounded-xl cursor-not-allowed text-sm"
        >
          Générer avec l&apos;IA (Phase 3)
        </button>
        {cv.isPremium && !cv.isPaid && (
          <button
            disabled
            className="flex-1 border border-amber-400/30 text-amber-400/40 font-semibold py-3 rounded-xl cursor-not-allowed text-sm"
          >
            Débloquer — 2000 FCFA (Phase 3)
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Créer `app/(dashboard)/cv/[id]/edit/page.tsx`**

```tsx
// apps/web/app/(dashboard)/cv/[id]/edit/page.tsx
import Link from 'next/link'

export default async function CvEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <Link href={`/cv/${id}`} className="text-neutral-400 hover:text-white text-sm transition mb-6 inline-block">
        ← Retour au CV
      </Link>
      <div className="text-4xl mb-4">✏️</div>
      <h1 className="text-2xl font-serif mb-4">Modifier le CV</h1>
      <p className="text-neutral-400 text-sm mb-6">
        La modification et la régénération seront disponibles en Phase 3,
        une fois l&apos;intégration Claude AI en place.
      </p>
      <span className="inline-block bg-neutral-800 text-neutral-400 text-xs px-3 py-1 rounded-full">
        Phase 3 — Claude AI
      </span>
    </div>
  )
}
```

- [ ] **Step 4 : Créer `app/(dashboard)/cv/[id]/versions/page.tsx`**

```tsx
// apps/web/app/(dashboard)/cv/[id]/versions/page.tsx
import Link from 'next/link'

export default async function CvVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/cv/${id}`} className="text-neutral-400 hover:text-white text-sm transition mb-6 inline-block">
        ← Retour au CV
      </Link>
      <h1 className="text-2xl font-serif mb-8">Historique des versions</h1>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
        <div className="text-3xl mb-3">🕐</div>
        <p className="text-neutral-400 text-sm">
          L&apos;historique des versions sera disponible après la première génération IA (Phase 3).
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 6 : Vérifier le lint**

```bash
cd apps/web && npx next lint
```

Attendu : pas d'erreurs.

- [ ] **Step 7 : Commit**

```bash
git add apps/web/lib/api.ts "apps/web/app/(dashboard)/cv/[id]/page.tsx" "apps/web/app/(dashboard)/cv/[id]/edit/page.tsx" "apps/web/app/(dashboard)/cv/[id]/versions/page.tsx"
git commit -m "feat: ajouter pages CV detail, edit stub et versions stub"
```

---

## Task 5 : Mise à jour dashboard + liens de navigation

**Files:**
- Modify: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Modify: `apps/web/components/NavBar.tsx`

**Goal:** Ajouter le lien "Nouveau CV" dans la NavBar et le bouton "Créer mon premier CV" sur le dashboard vide.

**Interfaces:**
- Consumes: `fetchCvs` depuis `@/lib/api`, `Cv` type depuis `@/types`

- [ ] **Step 1 : Lire le contenu actuel du dashboard**

Lire `apps/web/app/(dashboard)/dashboard/page.tsx` pour comprendre ce qui existe.

- [ ] **Step 2 : Modifier `dashboard/page.tsx`**

Remplacer l'état vide par un lien vers `/cv/nouveau`.

```tsx
// apps/web/app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CvCard from '@/components/CvCard'
import type { Cv } from '@/types'

async function getCvs(token: string): Promise<Cv[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  try {
    const res = await fetch(`${apiUrl}/api/cvs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const cvs = await getCvs(session.access_token)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif">Mes CVs</h1>
        <Link
          href="/cv/nouveau"
          className="bg-amber-400 text-neutral-950 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-300 transition"
        >
          + Nouveau CV
        </Link>
      </div>

      {cvs.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900 rounded-2xl border border-neutral-800">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="font-semibold text-lg mb-2">Aucun CV pour l&apos;instant</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Créez votre premier CV professionnel en quelques minutes.
          </p>
          <Link
            href="/cv/nouveau"
            className="bg-amber-400 text-neutral-950 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-amber-300 transition"
          >
            Créer mon premier CV →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv) => (
            <CvCard key={cv.id} cv={cv} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3 : Ajouter le lien "Nouveau CV" dans `NavBar.tsx`**

Lire `apps/web/components/NavBar.tsx` et ajouter un `<Link>` vers `/cv/nouveau` dans la section de navigation.

Dans la `<div className="flex gap-4 items-center">`, ajouter après le lien "Mes CVs" :

```tsx
<Link href="/cv/nouveau" className="bg-amber-400 text-neutral-950 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-amber-300 transition">
  + Nouveau CV
</Link>
```

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : exit 0.

- [ ] **Step 5 : Vérifier le lint**

```bash
cd apps/web && npx next lint
```

Attendu : pas d'erreurs.

- [ ] **Step 6 : Commit**

```bash
git add "apps/web/app/(dashboard)/dashboard/page.tsx" apps/web/components/NavBar.tsx
git commit -m "feat: ajouter CTA Nouveau CV sur dashboard et NavBar"
```
