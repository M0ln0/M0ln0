import type { Metadata } from "next";
import { Container, SectionHeader } from "@/components/ui/primitives";
import { PayoutSimulator } from "@/features/creator-space/payout-simulator";
import { SELLER_PLANS, type SellerPlan } from "@/config/fees";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Devenir créateur",
  description: "Ouvrez votre boutique sur Signé : visibilité, communauté, outils de vente et accompagnement pour les créateurs indépendants.",
};

const BENEFITS = [
  { t: "Votre boutique, votre univers", d: "Portrait, histoire, atelier, collections : votre page raconte qui vous êtes avant de montrer ce que vous vendez." },
  { t: "De la visibilité", d: "Sélections éditoriales, pages écoles, mises en avant sur nos réseaux. Les nouveaux talents sont au centre de la plateforme." },
  { t: "Une communauté", d: "Les acheteurs vous suivent et reçoivent vos nouvelles pièces. Vous rencontrez d'autres créateurs de votre ville ou de votre école." },
  { t: "Des outils simples", d: "Produits, variantes, stocks, pièces uniques, séries limitées, fabrication sur commande. Commandes et expéditions au même endroit." },
  { t: "Un accompagnement", d: "Photos, prix, fiche produit : l'équipe relit votre boutique avant l'ouverture et vous conseille." },
  { t: "Vos statistiques", d: "Visites, favoris, ventes, provenance de vos visiteurs. Comprenez ce qui marche et d'où viennent vos acheteurs." },
];

const STEPS = [
  { t: "Candidature", d: "Présentez-vous et montrez trois pièces." },
  { t: "Rencontre", d: "Un échange avec l'équipe pour vérifier votre identité et votre travail." },
  { t: "Boutique", d: "Vous créez vos fiches produits, nous relisons avec vous." },
  { t: "Ouverture", d: "Votre boutique est en ligne. Vous expédiez vous-même vos commandes." },
];

export default function BecomeCreatorPage() {
  return (
    <>
      <header className="border-b border-line">
        <Container className="grid gap-10 py-12 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">03 — Créer</p>
            <h1 className="mt-3 font-display text-display">
              Lancez <em className="text-signature">votre</em> marque.
            </h1>
          </div>
          <p className="text-lg text-ink-2">
            Signé est fait pour les étudiants en mode et en design, les jeunes diplômés et les petites marques qui lancent leur première collection. Nous voulons une communauté de créateurs, pas un catalogue anonyme.
          </p>
        </Container>
      </header>

      <Container className="py-16">
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <li key={b.t} className="bg-paper p-6 sm:p-8">
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-3 font-display text-3xl">{b.t}</h2>
              <p className="mt-3 text-ink-2">{b.d}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section className="bg-ink py-16 text-paper">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 text-paper/50">Offre de lancement</p>
            <h2 className="font-display text-headline">Les créateurs fondateurs.</h2>
          </div>
          <div className="space-y-4 text-paper/80">
            <p>
              Les premiers créateurs qui rejoignent Signé bénéficient de l&apos;offre Fondateur, d&apos;un portrait éditorial publié sur le site et d&apos;une mise en avant sur nos réseaux sociaux au lancement.
            </p>
            <p>En échange, nous leur demandons de nous aider à construire la plateforme : retours, idées, et de parler de Signé autour d&apos;eux.</p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <SectionHeader eyebrow="Comment ça marche" title="Quatre étapes, pas plus." />
        <ol className="grid gap-8 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="border-t-2 border-ink pt-4">
              <span className="font-display text-5xl text-signature">{i + 1}</span>
              <h3 className="mt-2 font-display text-2xl">{s.t}</h3>
              <p className="mt-2 text-sm text-ink-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </Container>

      <Container id="tarifs" className="scroll-mt-20 border-t border-line py-16">
        <SectionHeader
          eyebrow="Tarifs vendeurs"
          title="Combien vous reste-t-il sur une vente ?"
          intro="Pas de frais d'inscription. Signé se rémunère par une commission sur les ventes, avec un abonnement optionnel pour les marques qui vendent régulièrement."
        />
        <PayoutSimulator />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {(Object.keys(SELLER_PLANS) as SellerPlan[]).map((k) => (
            <div key={k} className="border-t border-line pt-4">
              <p className="font-display text-3xl">{SELLER_PLANS[k].label}</p>
              <p className="mt-1 font-mono text-sm">
                {Math.round(SELLER_PLANS[k].commissionRate * 100)} % par vente · {SELLER_PLANS[k].monthlyCents ? `${formatPrice(SELLER_PLANS[k].monthlyCents)} / mois` : "sans abonnement"}
              </p>
              <p className="mt-2 text-sm text-ink-2">{SELLER_PLANS[k].description}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container id="ecoles" className="scroll-mt-20 border-t border-line py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Écoles</p>
            <h2 className="font-display text-headline">Vous êtes une école ?</h2>
          </div>
          <div className="space-y-4 text-ink-2">
            <p>
              Une page dédiée présente votre école, vos étudiants et leurs collections. Les étudiants de vos promotions accèdent à l&apos;offre Fondateur et à un accompagnement pour ouvrir leur première boutique.
            </p>
            <p>Vous suivez la visibilité que Signé apporte à vos étudiants : visites, abonnés, ventes.</p>
          </div>
        </div>
      </Container>

      <Container id="candidature" className="scroll-mt-20 border-t border-line py-16">
        <SectionHeader eyebrow="Candidature" title="Ce qu'il faut préparer" />
        <ul className="grid gap-4 md:grid-cols-2">
          {[
            "Un portrait de vous, ou de votre atelier.",
            "Trois pièces photographiées sur fond neutre, dont une portée si c'est un vêtement ou un bijou.",
            "Quelques lignes sur votre parcours et votre façon de travailler.",
            "Vos prix, vos délais de fabrication et les pays où vous expédiez.",
          ].map((x) => (
            <li key={x} className="flex gap-3 border-t border-line pt-4">
              <span aria-hidden className="text-signature">✓</span>
              {x}
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
