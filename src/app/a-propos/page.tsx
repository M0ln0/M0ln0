import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "À propos",
  description: "Signé est une marketplace de créateurs indépendants de mode, de design et d'objets. Notre mission : révéler les créateurs avant qu'ils deviennent connus.",
};

const PRINCIPLES = [
  { t: "Le créateur d'abord", d: "Chaque pièce est rattachée à une personne, une histoire, un atelier. Nous montrons des visages, pas des références." },
  { t: "Sélectionner, pas empiler", d: "Chaque créateur est vérifié et chaque produit relu avant publication. Nous préférons une communauté soudée à un catalogue infini." },
  { t: "Petites séries, vraies pièces", d: "Pièces uniques, séries limitées, fabrication à la commande. Ce que vous achetez ici n'existe pas en milliers d'exemplaires." },
  { t: "La confiance", d: "Paiement sécurisé, avis d'acheteurs vérifiés, médiation en cas de problème. Acheter à un créateur qui démarre doit être aussi sûr qu'ailleurs." },
];

export default function AboutPage() {
  return (
    <>
      <Container className="border-b border-line py-12 sm:py-20">
        <p className="eyebrow">À propos</p>
        <h1 className="mt-3 max-w-5xl font-display text-display">
          Découvrir les futurs créateurs <em className="text-signature">avant</em> qu&apos;ils deviennent connus.
        </h1>
      </Container>
      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_1.4fr]">
        <p className="font-display text-4xl leading-tight">La mode a des visages. Le design aussi.</p>
        <div className="space-y-5 text-lg text-ink-2">
          <p>
            Chaque année, des milliers d&apos;étudiants en mode, en design et en arts appliqués présentent des collections remarquables. La plupart ne sont jamais vendues. Les jeunes marques, elles, se perdent entre les réseaux sociaux et les grandes plateformes.
          </p>
          <p>
            Signé est né pour leur donner une maison : un lieu où l&apos;on découvre une personne et son univers, et où l&apos;on peut acheter directement ce qu&apos;elle fabrique.
          </p>
        </div>
      </Container>
      <Container className="border-t border-line py-16">
        <ul className="grid gap-10 md:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <li key={p.t}>
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-2 font-display text-4xl">{p.t}</h2>
              <p className="mt-3 text-ink-2">{p.d}</p>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex flex-wrap gap-3">
          <ButtonLink href="/createurs" size="lg">
            Découvrir les créateurs
          </ButtonLink>
          <ButtonLink href="/devenir-createur" variant="outline" size="lg">
            Devenir créateur
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
