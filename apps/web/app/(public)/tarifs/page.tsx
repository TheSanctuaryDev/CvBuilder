// apps/web/app/(public)/tarifs/page.tsx
import Link from 'next/link'
import { Check } from 'lucide-react'

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
          <div className="text-4xl font-bold text-white my-4">0 FCFA</div>
          <p className="text-neutral-400 text-sm mb-6">Par CV généré</p>
          <ul className="space-y-3 text-sm text-neutral-300 mb-8">
            {[
              '2 templates disponibles',
              'Compte requis',
              'Téléchargement PDF',
              'Historique de vos CVs',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white shrink-0" /> {f}
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
        <div className="bg-neutral-900 border-2 border-white rounded-2xl p-8 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-4 py-1 rounded-full">
            POPULAIRE
          </span>
          <h2 className="text-2xl font-serif mb-1">Premium</h2>
          <div className="text-4xl font-bold text-white my-4">2000 FCFA</div>
          <p className="text-neutral-400 text-sm mb-6">Par CV premium généré</p>
          <ul className="space-y-3 text-sm text-neutral-300 mb-8">
            {[
              '13 templates premium exclusifs',
              'Paiement par carte ou Mobile Money',
              'Téléchargement PDF haute qualité',
              'Historique et versions',
              'Modification et régénération',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Link
            href="/templates"
            className="block text-center bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition"
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
