import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Media } from "@/components/ui/media";
import { Badge, ButtonLink, Container, EmptyState, SectionHeader } from "@/components/ui/primitives";
import { CreatorRow } from "@/features/creators/creator-card";
import { ProductGrid } from "@/features/marketplace/product-card";
import { SCHOOL_KIND_LABELS } from "@/lib/labels";
import { getSchool, listPublicSlugs } from "@/services/catalog";

export async function generateStaticParams() {
  const { schools } = await listPublicSlugs();
  return schools.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/ecoles/[slug]">): Promise<Metadata> {
  const detail = await getSchool((await params).slug);
  if (!detail) return {};
  return { title: detail.school.name, description: detail.school.description };
}

export default async function SchoolPage({ params }: PageProps<"/ecoles/[slug]">) {
  const detail = await getSchool((await params).slug);
  if (!detail) notFound();
  const { school, creators, newTalents, products, collections } = detail;

  return (
    <>
      <header>
        <Media media={school.cover} ratio="aspect-[5/2] sm:aspect-[4/1]" priority sizes="100vw" />
        <Container className="border-b border-line py-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">
              {SCHOOL_KIND_LABELS[school.kind]} · {school.city}
            </span>
            {school.partner && <Badge tone="signature">École partenaire</Badge>}
          </div>
          <h1 className="mt-2 font-display text-display">{school.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-2">{school.description}</p>
          <dl className="mt-6 flex gap-8">
            <div>
              <dt className="eyebrow">Créateurs</dt>
              <dd className="font-display text-4xl">{creators.length}</dd>
            </div>
            <div>
              <dt className="eyebrow">Collections</dt>
              <dd className="font-display text-4xl">{collections.length}</dd>
            </div>
          </dl>
        </Container>
      </header>

      {creators.length === 0 ? (
        <Container className="py-16">
          <EmptyState title="Les premiers créateurs arrivent bientôt." action={<ButtonLink href="/devenir-createur">Vous êtes étudiant·e ici ?</ButtonLink>} />
        </Container>
      ) : (
        <>
          {newTalents.length > 0 && (
            <Container className="py-16">
              <SectionHeader eyebrow="Nouveaux talents" title="Encore en formation" />
              <CreatorRow items={newTalents} />
            </Container>
          )}
          <Container className="border-t border-line py-16">
            <SectionHeader eyebrow="Créateurs présents" title={`Formés à ${school.shortName}`} action={{ href: `/createurs?ecole=${school.slug}`, label: "Voir la liste" }} />
            <CreatorRow items={creators} />
          </Container>
          {collections.length > 0 && (
            <Container className="border-t border-line py-16">
              <SectionHeader eyebrow="Collections" title="Nées ici" />
              <div className="grid gap-8 md:grid-cols-3">
                {collections.map((c) => (
                  <Link key={c.id} href={`/createurs/${c.creator.slug}#collections`} className="group">
                    <Media media={c.cover} ratio="aspect-[4/3]" className="rounded-card" sizes="(min-width: 768px) 33vw, 100vw" />
                    <p className="eyebrow mt-3">
                      {c.season} · {c.creator.brandName}
                    </p>
                    <h3 className="font-display text-3xl group-hover:text-signature">{c.title}</h3>
                  </Link>
                ))}
              </div>
            </Container>
          )}
          <Container className="border-t border-line py-16">
            <SectionHeader eyebrow="Créations" title="Les dernières pièces" action={{ href: `/explorer?ecole=${school.slug}`, label: "Toutes les pièces" }} />
            <ProductGrid items={products} />
          </Container>
        </>
      )}
    </>
  );
}
