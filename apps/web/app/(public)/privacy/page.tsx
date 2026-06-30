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
          className="text-white hover:underline text-sm"
        >
          thesanctuarydev29@gmail.com
        </a>
      </section>
    </div>
  )
}
