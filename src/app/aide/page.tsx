import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Aide",
  description: "Commandes, livraison, retours, pièces uniques : les réponses à vos questions sur Signé.",
};

const FAQ: { section: string; items: { q: string; a: string }[] }[] = [
  {
    section: "Commander",
    items: [
      { q: "Je commande chez plusieurs créateurs. Que se passe-t-il ?", a: "Votre panier peut réunir les pièces de plusieurs créateurs. Vous payez une seule fois, mais chaque créateur prépare et expédie sa partie séparément. Vous recevez donc plusieurs colis, chacun avec son suivi, et les frais de livraison sont indiqués créateur par créateur." },
      { q: "Qu'est-ce qu'une pièce unique ?", a: "Une pièce qui n'existe qu'en un seul exemplaire. Elle est réservée pour vous pendant le paiement, puis retirée de la vente." },
      { q: "Que veut dire « sur commande » ?", a: "La pièce est fabriquée pour vous après votre achat. Le délai de fabrication est indiqué sur la fiche produit, avant l'expédition." },
      { q: "Le paiement est-il sécurisé ?", a: "Oui. Le paiement est traité par un prestataire spécialisé. Le créateur est payé une fois la commande expédiée, et Signé intervient en cas de problème." },
    ],
  },
  {
    section: "Livraison",
    items: [
      { q: "Qui expédie ma commande ?", a: "Le créateur lui-même, depuis son atelier. Il renseigne le numéro de suivi dès l'envoi." },
      { q: "Mon colis est en retard ou perdu.", a: "Ouvrez une demande depuis votre commande. Nous contactons le créateur et le transporteur, et nous vous remboursons si le colis est perdu." },
      { q: "Je me suis trompé d'adresse.", a: "Contactez-nous au plus vite depuis votre commande : si le colis n'est pas encore parti, le créateur peut corriger l'adresse." },
    ],
  },
  {
    section: "Retours et problèmes",
    items: [
      { q: "Puis-je retourner une pièce ?", a: "Oui, sous 14 jours après réception, sauf pour les pièces fabriquées sur mesure. Faites la demande depuis votre commande. Le remboursement est déclenché à la réception du retour par le créateur." },
      { q: "La pièce reçue est abîmée ou différente.", a: "Ouvrez une demande avec des photos. Nous examinons les éléments des deux côtés avant de proposer un remboursement, un échange ou un retour." },
      { q: "Le créateur ne répond pas.", a: "Sans réponse sous 48 heures, notre équipe prend le relais et tranche." },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <Container className="border-b border-line py-12 sm:py-16">
        <p className="eyebrow">Aide</p>
        <h1 className="mt-3 font-display text-display">Des questions ?</h1>
      </Container>
      <Container className="grid gap-16 py-16 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Rubriques" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm">
            {FAQ.map((s) => (
              <li key={s.section}>
                <a href={`#${s.section}`} className="hover:text-signature">
                  {s.section}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16">
          {FAQ.map((s) => (
            <section key={s.section} id={s.section} className="scroll-mt-24">
              <h2 className="mb-4 font-display text-4xl">{s.section}</h2>
              <div className="divide-y divide-line border-y border-line">
                {s.items.map((it) => (
                  <details key={it.q} className="group py-5">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 font-medium">
                      {it.q}
                      <span aria-hidden className="text-xl text-ink-3 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl text-ink-2">{it.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
