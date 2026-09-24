import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { Logo } from "./site-header";

const COLUMNS = [
  {
    title: "Découvrir",
    links: [
      { href: "/createurs", label: "Créateurs" },
      { href: "/ecoles", label: "Écoles" },
      { href: "/explorer?tri=new", label: "Nouveautés" },
      { href: "/explorer?edition=unique", label: "Pièces uniques" },
    ],
  },
  {
    title: "Acheter",
    links: [
      { href: "/explorer?categorie=vetements", label: "Vêtements" },
      { href: "/explorer?categorie=bijoux", label: "Bijoux" },
      { href: "/explorer?categorie=objets", label: "Objets" },
      { href: "/explorer?categorie=maison", label: "Maison" },
    ],
  },
  {
    title: "Créer",
    links: [
      { href: "/devenir-createur", label: "Devenir créateur" },
      { href: "/devenir-createur#ecoles", label: "Écoles partenaires" },
      { href: "/devenir-createur#tarifs", label: "Tarifs vendeurs" },
    ],
  },
  {
    title: "Signé",
    links: [
      { href: "/a-propos", label: "À propos" },
      { href: "/aide", label: "Aide" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm font-display text-3xl leading-tight text-paper/90">
              Découvrir les futurs créateurs avant qu&apos;ils deviennent connus.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="eyebrow mb-4 text-paper/50">{col.title}</p>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-paper/80 hover:text-paper">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-16 border-t border-paper/15 pt-6 font-mono text-xs text-paper/50">© {new Date().getFullYear()} Signé. Mode, design et objets de créateurs indépendants.</p>
      </Container>
    </footer>
  );
}
