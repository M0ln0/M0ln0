import type { Metadata } from "next";
import Link from "next/link";
import { Media } from "@/components/ui/media";
import { Badge, ButtonLink, Container } from "@/components/ui/primitives";
import { SCHOOL_KIND_LABELS } from "@/lib/labels";
import { listSchools } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Écoles",
  description: "Les écoles de mode, de design et d'arts appliqués dont les étudiants et diplômés vendent sur Signé.",
};

export default async function SchoolsPage() {
  const schools = await listSchools();
  return (
    <>
      <Container className="border-b border-line py-12 sm:py-16">
        <p className="eyebrow">Écoles</p>
        <h1 className="mt-3 max-w-4xl font-display text-display">Là où tout commence.</h1>
        <p className="mt-6 max-w-xl text-lg text-ink-2">
          Les premières collections naissent souvent en école. Signé leur ouvre une vitrine dès les premières pièces.
        </p>
      </Container>
      <Container className="py-12">
        <ul className="grid gap-10 md:grid-cols-2">
          {schools.map(({ school, creatorCount, productCount }) => (
            <li key={school.id}>
              <Link href={`/ecoles/${school.slug}`} className="group block">
                <Media media={school.cover} ratio="aspect-[16/9]" className="rounded-card" sizes="(min-width: 768px) 50vw, 100vw" />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="eyebrow">
                    {SCHOOL_KIND_LABELS[school.kind]} · {school.city}
                  </span>
                  {school.partner && <Badge tone="signature">Partenaire</Badge>}
                </div>
                <h2 className="mt-1 font-display text-4xl group-hover:text-signature">{school.name}</h2>
                <p className="mt-2 max-w-lg text-ink-2">{school.description}</p>
                <p className="mt-3 font-mono text-xs text-ink-3">
                  {creatorCount} {creatorCount > 1 ? "créateurs" : "créateur"} · {productCount} {productCount > 1 ? "pièces" : "pièce"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-y border-ink py-10 md:flex-row md:items-center">
          <p className="max-w-2xl font-display text-4xl">Vous représentez une école de création ?</p>
          <ButtonLink href="/devenir-createur#ecoles" variant="outline">
            Devenir école partenaire
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
