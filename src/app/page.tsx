import Link from "next/link";
import { Media } from "@/components/ui/media";
import { ButtonLink, Container, SectionHeader } from "@/components/ui/primitives";
import { CreatorCard } from "@/features/creators/creator-card";
import { ProductGrid } from "@/features/marketplace/product-card";
import { formatMonthYear } from "@/lib/format";
import { SCHOOL_KIND_LABELS } from "@/lib/labels";
import { getHome } from "@/services/catalog";

const DOORS = [
  { n: "01", verb: "Acheter", line: "Trouver une pièce.", text: "Pièces uniques, séries limitées, fabriquées à la main par celles et ceux qui les ont dessinées.", href: "/explorer" },
  { n: "02", verb: "Découvrir", line: "Trouver un créateur.", text: "Des étudiants, de jeunes diplômés, des marques qui lancent leur première collection.", href: "/createurs" },
  { n: "03", verb: "Créer", line: "Lancer sa marque.", text: "Une boutique à votre image, une communauté, et des outils pour vendre dès la première pièce.", href: "/devenir-createur" },
];

export default async function HomePage() {
  const home = await getHome();
  const [lead, ...others] = home.featuredCreators;

  return (
    <>
      {/* Mission */}
      <section className="border-b border-line">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:py-24">
          <div>
            <p className="eyebrow mb-6">Créateurs indépendants · mode, design, objets</p>
            <h1 className="font-display text-display">
              La mode <br />
              a des <em className="text-signature">visages.</em>
            </h1>
            <p className="mt-8 max-w-lg text-lg text-ink-2">
              Signé est la maison des créateurs indépendants. Découvrez les futurs noms de la mode et du design avant qu&apos;ils deviennent connus, et achetez directement à celles et ceux qui fabriquent.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/createurs" size="lg">
                Découvrir les créateurs
              </ButtonLink>
              <ButtonLink href="/explorer" variant="outline" size="lg">
                Explorer les pièces
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {home.featuredCreators.slice(0, 3).map((c, i) => (
              <Link key={c.creator.id} href={`/createurs/${c.creator.slug}`} className={i === 1 ? "translate-y-6 sm:translate-y-10" : ""}>
                <Media media={c.creator.portrait} ratio="aspect-[3/5]" className="rounded-card" priority sizes="(min-width: 1024px) 14vw, 30vw" />
                <p className="mt-2 font-display text-lg leading-tight">{c.creator.realName.split(" ")[0]}</p>
                <p className="eyebrow">{c.creator.city}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Trois portes */}
      <section aria-label="Par où commencer">
        <Container className="grid border-b border-line md:grid-cols-3">
          {DOORS.map((d) => (
            <Link
              key={d.n}
              href={d.href}
              className="group flex flex-col border-line py-8 transition-colors hover:bg-paper-2 md:border-r md:px-8 md:py-12 md:first:pl-0 md:last:border-r-0 [&:not(:last-child)]:border-b md:[&:not(:last-child)]:border-b-0"
            >
              <span className="eyebrow">
                {d.n} — {d.verb}
              </span>
              <span className="mt-3 font-display text-4xl group-hover:text-signature">{d.line}</span>
              <span className="mt-3 max-w-sm text-sm text-ink-2">{d.text}</span>
              <span aria-hidden className="mt-6 text-xl transition-transform group-hover:translate-x-2">
                →
              </span>
            </Link>
          ))}
        </Container>
      </section>

      {/* Sélection du mois */}
      {lead && (
        <section className="py-20">
          <Container>
            <SectionHeader
              eyebrow={`Sélection · ${formatMonthYear(lead.creator.selectedAt ?? lead.creator.joinedAt)}`}
              title="Ils viennent d'arriver. Retenez leurs noms."
              action={{ href: "/createurs", label: "Tous les créateurs" }}
            />
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
              <article className="grid gap-6 sm:grid-cols-2">
                <Media media={lead.creator.portrait} ratio="aspect-[4/5]" className="rounded-card" sizes="(min-width: 1024px) 28vw, 90vw" />
                <div className="flex flex-col">
                  <p className="eyebrow">
                    {lead.creator.city}
                    {lead.school ? ` · ${lead.school.name}` : ""}
                  </p>
                  <h3 className="mt-2 font-display text-5xl leading-none">{lead.creator.brandName}</h3>
                  <p className="mt-1 text-sm text-ink-3">{lead.creator.realName}</p>
                  <blockquote className="mt-6 border-l-2 border-signature pl-4 font-display text-2xl leading-snug">
                    « {lead.creator.motivation} »
                  </blockquote>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
                    {lead.preview.map((p) => (
                      <Link key={p.product.id} href={`/produits/${p.product.slug}`}>
                        <Media media={p.product.images[0]} hint={{ subcategory: p.product.subcategory, tint: p.product.colors[0]?.hex }} ratio="aspect-square" className="rounded-card" sizes="150px" />
                        <span className="mt-1 block truncate text-xs">{p.product.title}</span>
                      </Link>
                    ))}
                  </div>
                  <ButtonLink href={`/createurs/${lead.creator.slug}`} variant="outline" className="mt-6 self-start">
                    Entrer dans l&apos;univers
                  </ButtonLink>
                </div>
              </article>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {others.slice(0, 2).map((c) => (
                  <CreatorCard key={c.creator.id} data={c} />
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Nouveautés */}
      <section className="border-t border-line py-20">
        <Container>
          <SectionHeader eyebrow="Nouveautés" title="Tout juste sorti de l'atelier" action={{ href: "/explorer?tri=new", label: "Voir toutes les nouveautés" }} />
          <ProductGrid items={home.newArrivals} />
        </Container>
      </section>

      {/* Collections */}
      <section className="bg-ink py-20 text-paper">
        <Container>
          <p className="eyebrow mb-3 text-paper/50">Collections</p>
          <h2 className="mb-10 max-w-2xl font-display text-headline">Une collection, c&apos;est une idée qui tient debout.</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {home.collections.map((c) => (
              <Link key={c.id} href={`/createurs/${c.creator.slug}#collections`} className="group">
                <Media media={c.cover} ratio="aspect-[4/3]" className="rounded-card" sizes="(min-width: 768px) 33vw, 100vw" />
                <p className="eyebrow mt-4 text-paper/50">
                  {c.season} · {c.creator.brandName}
                </p>
                <h3 className="mt-1 font-display text-3xl group-hover:text-signature">{c.title}</h3>
                <p className="mt-2 text-sm text-paper/70">{c.description}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Écoles */}
      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow mb-3">Écoles</p>
            <h2 className="font-display text-headline">Là où tout commence.</h2>
            <p className="mt-4 max-w-md text-ink-2">
              Signé travaille avec des écoles de mode, de design et d&apos;arts appliqués pour ouvrir une vitrine aux étudiants dès leur première collection.
            </p>
            <ButtonLink href="/ecoles" variant="outline" className="mt-8">
              Voir les écoles
            </ButtonLink>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {home.schools.map((s) => (
              <li key={s.school.id}>
                <Link href={`/ecoles/${s.school.slug}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-4 py-5">
                  <span>
                    <span className="block font-display text-3xl group-hover:text-signature">{s.school.name}</span>
                    <span className="eyebrow">
                      {SCHOOL_KIND_LABELS[s.school.kind]} · {s.school.city}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-ink-3">
                    {s.creatorCount} {s.creatorCount > 1 ? "créateurs" : "créateur"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Communauté */}
      <section className="border-t border-line bg-paper-2 py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">Communauté</p>
              <h2 className="font-display text-headline">Chaque pièce est signée par quelqu&apos;un.</h2>
              <p className="mt-4 max-w-md text-ink-2">
                Suivez vos créateurs, recevez leurs nouvelles pièces, partagez leurs boutiques. Ici, acheter c&apos;est soutenir une personne qui démarre.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-line">
              {[
                { n: home.community.creators, l: "créateurs" },
                { n: home.community.schools, l: "écoles" },
                { n: home.community.cities, l: "villes" },
                { n: home.community.pieces, l: "pièces en ligne" },
              ].map((s) => (
                <div key={s.l} className="bg-paper-2 p-6">
                  <dt className="eyebrow">{s.l}</dt>
                  <dd className="mt-2 font-display text-6xl">{s.n}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* Créer */}
      <section className="py-20">
        <Container className="flex flex-col items-start justify-between gap-8 border-y border-ink py-12 md:flex-row md:items-center">
          <div>
            <p className="eyebrow mb-3">03 — Créer</p>
            <p className="max-w-2xl font-display text-headline">Vous fabriquez ? Votre boutique vous attend.</p>
          </div>
          <ButtonLink href="/devenir-createur" variant="signature" size="lg">
            Lancer sa marque
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
