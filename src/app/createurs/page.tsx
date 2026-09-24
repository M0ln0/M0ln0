import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Container, EmptyState, SectionHeader } from "@/components/ui/primitives";
import { CreatorCard, CreatorRow } from "@/features/creators/creator-card";
import { cn } from "@/lib/cn";
import { STAGE_LABELS, UNIVERSE_LABELS } from "@/lib/labels";
import { parseCreatorQuery } from "@/lib/search/query";
import { getCreatorDiscovery, searchCreators } from "@/services/catalog";
import type { Universe } from "@/types/domain";

export const metadata: Metadata = {
  title: "Découvrir les créateurs",
  description: "Étudiants, jeunes diplômés, marques indépendantes : découvrez les créateurs de Signé par école, par ville et par univers.",
};

function Chip({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm", active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}>
      {children}
    </Link>
  );
}

export default async function CreatorsPage({ searchParams }: PageProps<"/createurs">) {
  const query = parseCreatorQuery(await searchParams);
  const filtered = !!(query.q || query.city || query.school || query.universe || query.stage || query.sort !== "featured");
  const [discovery, results] = await Promise.all([getCreatorDiscovery(), filtered ? searchCreators(query) : Promise.resolve([])]);
  const schoolName = query.school && discovery.schools.find((s) => s.school.slug === query.school)?.school.name;

  const heading = query.universe
    ? UNIVERSE_LABELS[query.universe as Universe]
    : query.city
      ? `À ${query.city}`
      : schoolName
        ? schoolName
        : query.stage
          ? STAGE_LABELS[query.stage as keyof typeof STAGE_LABELS]
          : query.sort === "new"
            ? "Nouveaux créateurs"
            : query.sort === "popular"
              ? "Créateurs populaires"
              : "Recherche";

  return (
    <>
      <header className="border-b border-line">
        <Container className="py-12 sm:py-16">
          <p className="eyebrow">Découvrir</p>
          <h1 className="mt-3 max-w-4xl font-display text-display">
            Les créateurs, <em className="text-signature">avant</em> tout le monde.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">
            Chaque créateur est rencontré et vérifié par l&apos;équipe Signé. Parcourez-les par école, par ville ou par univers.
          </p>
          <div className="mt-8 space-y-3">
            <div className="scroll-row auto-cols-max gap-2">
              <Chip href="/createurs" active={!filtered}>
                Sélection
              </Chip>
              <Chip href="/createurs?tri=new" active={query.sort === "new" && !query.city && !query.universe}>
                Nouveaux
              </Chip>
              <Chip href="/createurs?tri=popular" active={query.sort === "popular"}>
                Populaires
              </Chip>
              <Chip href="/createurs?profil=student" active={query.stage === "student"}>
                Étudiants
              </Chip>
              {discovery.universes.map((u) => (
                <Chip key={u.universe} href={`/createurs?univers=${u.universe}`} active={query.universe === u.universe}>
                  {UNIVERSE_LABELS[u.universe]}
                </Chip>
              ))}
            </div>
            <div className="scroll-row auto-cols-max gap-2">
              {discovery.cities.map((c) => (
                <Chip key={c.city} href={`/createurs?ville=${encodeURIComponent(c.city)}`} active={query.city === c.city}>
                  {c.city} <span className="font-mono text-xs opacity-60">{c.count}</span>
                </Chip>
              ))}
            </div>
          </div>
        </Container>
      </header>

      {filtered ? (
        <Container className="py-12">
          <SectionHeader eyebrow={`${results.length} ${results.length > 1 ? "créateurs" : "créateur"}`} title={heading} />
          {results.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {results.map((c) => (
                <CreatorCard key={c.creator.id} data={c} />
              ))}
            </div>
          ) : (
            <EmptyState title="Personne ici, pour l'instant." action={<ButtonLink href="/createurs">Toute la sélection</ButtonLink>} />
          )}
        </Container>
      ) : (
        <>
          <Container className="py-16">
            <SectionHeader eyebrow="Récemment sélectionnés" title="Les coups de cœur de l'équipe" intro="Chaque mois, Signé met en avant des créateurs rencontrés en atelier, en école ou en salon." />
            <CreatorRow items={discovery.selected.slice(0, 4)} />
          </Container>
          <Container className="border-t border-line py-16">
            <SectionHeader eyebrow="Émergents" title="Ils commencent à faire parler d'eux" action={{ href: "/createurs?tri=new", label: "Tous les nouveaux" }} />
            <CreatorRow items={discovery.emerging.slice(0, 4)} />
          </Container>
          <section className="bg-ink py-16 text-paper">
            <Container>
              <p className="eyebrow mb-3 text-paper/50">Étudiants</p>
              <h2 className="mb-10 max-w-2xl font-display text-headline">Encore à l&apos;école. Déjà une signature.</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 [&_.text-ink-2]:text-paper/70 [&_.text-ink-3]:text-paper/50 [&_.eyebrow]:text-paper/50">
                {discovery.students.slice(0, 4).map((c) => (
                  <CreatorCard key={c.creator.id} data={c} />
                ))}
              </div>
              <ButtonLink href="/createurs?profil=student" variant="outline" className="mt-10 border-paper text-paper hover:bg-paper hover:text-ink">
                Tous les étudiants
              </ButtonLink>
            </Container>
          </section>
          <Container className="py-16">
            <SectionHeader eyebrow="Populaires" title="Les plus suivis" action={{ href: "/createurs?tri=popular", label: "Voir le classement" }} />
            <CreatorRow items={discovery.popular.slice(0, 4)} />
          </Container>
          <Container className="border-t border-line py-16">
            <SectionHeader eyebrow="Par école" title="De l'atelier de l'école à votre porte" action={{ href: "/ecoles", label: "Toutes les écoles" }} />
            <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
              {discovery.schools.map((s) => (
                <li key={s.school.id} className="bg-paper">
                  <Link href={`/createurs?ecole=${s.school.slug}`} className="group block p-6 hover:bg-paper-2">
                    <span className="eyebrow">{s.school.city}</span>
                    <span className="mt-1 block font-display text-3xl group-hover:text-signature">{s.school.name}</span>
                    <span className="mt-2 block font-mono text-xs text-ink-3">
                      {s.creatorCount} créateurs · {s.productCount} pièces
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </>
      )}
    </>
  );
}
