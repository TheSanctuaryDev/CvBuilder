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
        <section className="max-w-5xl mx-auto px-4 pt-14 sm:pt-24 pb-16 sm:pb-20 text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6">
            Alimenté par Claude AI
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold leading-tight mb-6">
            Votre CV professionnel{' '}
            <span className="text-white block sm:inline">en quelques minutes</span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Renseignez vos informations, choisissez un template, et notre IA génère
            un CV impeccable au format PDF — prêt à envoyer.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-neutral-200 transition text-lg"
              >
                Mon dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-neutral-200 transition text-lg"
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
        <section className="bg-neutral-900 py-14 sm:py-20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-serif text-center mb-12">Comment ça marche</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Choisissez un template', desc: 'Sélectionnez parmi nos 15 templates professionnels — 2 gratuits, 13 premium.' },
                { step: '02', title: 'Renseignez vos infos', desc: 'Complétez le formulaire guidé : expériences, formation, compétences.' },
                { step: '03', title: 'Téléchargez votre PDF', desc: 'Claude AI génère votre CV en HTML optimisé, converti en PDF propre.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="text-4xl font-serif text-white mb-3">{step}</div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-neutral-400 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tarifs teaser */}
        <section className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h2 className="text-3xl font-serif mb-4">Tarifs simples</h2>
          <p className="text-neutral-400 mb-8">Templates gratuits à 0 FCFA. Templates premium à 2000 FCFA par CV.</p>
          <Link
            href="/tarifs"
            className="border border-white text-white px-6 py-2 rounded-lg hover:bg-white/10 transition"
          >
            Voir tous les tarifs
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
