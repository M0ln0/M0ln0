import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Media } from "@/components/ui/media";
import { Badge, Container, SectionHeader, Stars } from "@/components/ui/primitives";
import { ShareMenu } from "@/features/community/share-menu";
import { ProductGrid } from "@/features/marketplace/product-card";
import { formatCount, formatDate, formatMonthYear } from "@/lib/format";
import { STAGE_LABELS, UNIVERSE_LABELS } from "@/lib/labels";
import { getCreatorProfile, listPublicSlugs } from "@/services/catalog";

export async function generateStaticParams() {
  const { creators } = await listPublicSlugs();
  return creators.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/createurs/[slug]">): Promise<Metadata> {
  const profile = await getCreatorProfile((await params).slug);
  if (!profile) return {};
  return {
    title: `${profile.creator.brandName} — ${profile.creator.realName}`,
    description: `${profile.creator.tagline} ${profile.creator.specialty}, ${profile.creator.city}.`,
  };
}

export default async function CreatorPage({ params }: PageProps<"/createurs/[slug]">) {
  const profile = await getCreatorProfile((await params).slug);
  if (!profile) notFound();
  const { creator, school, collections, products, reviews, rating, following } = profile;
  const first = creator.realName.split(" ")[0];
  const socials = creator.showSocials
    ? [
        creator.socials.instagram && { label: "Instagram", href: `https://instagram.com/${creator.socials.instagram}`, handle: `@${creator.socials.instagram}` },
        creator.socials.tiktok && { label: "TikTok", href: `https://tiktok.com/@${creator.socials.tiktok}`, handle: `@${creator.socials.tiktok}` },
        creator.socials.website && { label: "Site", href: `https://${creator.socials.website}`, handle: creator.socials.website },
      ].filter((x): x is { label: string; href: string; handle: string } => !!x)
    : [];

  return (
    <>
      {/* En-tête : un visage et un nom */}
      <header>
        <Media media={creator.cover} ratio="aspect-[5/2] sm:aspect-[4/1]" priority sizes="100vw" />
        <Container className="relative">
          <div className="-mt-16 grid gap-6 sm:-mt-24 md:grid-cols-[220px_1fr] md:items-end">
            <Media media={creator.portrait} ratio="aspect-[4/5]" className="w-40 rounded-card ring-4 ring-paper sm:w-52" priority sizes="220px" />
            <div className="pb-2">
              <div className="flex flex-wrap gap-2">
                <Badge>{STAGE_LABELS[creator.stage]}</Badge>
                {creator.launchPartner && <Badge tone="signature">Créateur fondateur</Badge>}
                {creator.selectedAt && <Badge tone="ink">Sélection {formatMonthYear(creator.selectedAt)}</Badge>}
              </div>
              <h1 className="mt-3 font-display text-display">{creator.brandName}</h1>
              <p className="mt-2 text-ink-2">
                {creator.realName}
                {creator.pseudonym && creator.pseudonym !== creator.brandName ? ` · alias « ${creator.pseudonym} »` : ""} · {creator.specialty} · {creator.city}
                {school && (
                  <>
                    {" · "}
                    <Link href={`/ecoles/${school.slug}`} className="underline underline-offset-4 hover:text-signature">
                      {school.name}
                      {creator.graduationYear ? ` ${creator.graduationYear}` : ""}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-line py-4">
            <dl className="flex gap-8">
              <div>
                <dt className="eyebrow">Abonnés</dt>
                <dd className="font-display text-3xl">{formatCount(creator.followerCount)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Pièces</dt>
                <dd className="font-display text-3xl">{products.length}</dd>
              </div>
              {rating.count > 0 && (
                <div>
                  <dt className="eyebrow">Avis</dt>
                  <dd className="font-display text-3xl">{rating.average.toLocaleString("fr-FR")}</dd>
                </div>
              )}
              <div>
                <dt className="eyebrow">Sur Signé depuis</dt>
                <dd className="font-display text-3xl">{formatMonthYear(creator.joinedAt)}</dd>
              </div>
            </dl>
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-4 text-sm">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer me" className="hover:text-signature">
                      <span className="eyebrow mr-1">{s.label}</span>
                      {s.handle}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <ShareMenu className="ml-auto" path={`/createurs/${creator.slug}`} title={creator.brandName} text={`Découvrez ${creator.brandName}, ${creator.specialty.toLowerCase()} à ${creator.city}, sur Signé`} />
          </div>
        </Container>
      </header>

      {/* Qui, quoi, pourquoi, quel univers */}
      <Container className="py-16">
        <p className="max-w-4xl font-display text-headline">{creator.tagline}</p>
        <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <section>
            <h2 className="eyebrow mb-3">Qui</h2>
            <p className="text-ink-2">{creator.bio}</p>
          </section>
          <section>
            <h2 className="eyebrow mb-3">Ce que {first} crée</h2>
            <p className="text-ink-2">{creator.specialty}. {collections.length > 0 && `${collections.length} ${collections.length > 1 ? "collections" : "collection"} en ligne.`}</p>
          </section>
          <section>
            <h2 className="eyebrow mb-3">Pourquoi</h2>
            <p className="font-display text-xl leading-snug">« {creator.motivation} »</p>
          </section>
          <section>
            <h2 className="eyebrow mb-3">Univers</h2>
            <ul className="flex flex-wrap gap-2">
              {creator.universes.map((u) => (
                <li key={u}>
                  <Link href={`/createurs?univers=${u}`} className="inline-block rounded-full border border-line px-3 py-1 text-sm hover:border-ink">
                    {UNIVERSE_LABELS[u]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Container>

      {/* Histoire et atelier */}
      <section className="bg-paper-2 py-16">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          {creator.atelier && <Media media={creator.atelier} ratio="aspect-[16/10]" className="rounded-card" sizes="(min-width: 768px) 50vw, 100vw" />}
          <div>
            <p className="eyebrow mb-3">L&apos;histoire</p>
            <p className="font-display text-3xl leading-snug">{creator.story}</p>
          </div>
        </Container>
      </section>

      {collections.length > 0 && (
        <Container id="collections" className="scroll-mt-20 py-16">
          <SectionHeader eyebrow="Collections" title={`Les collections de ${creator.brandName}`} />
          <div className="grid gap-8 md:grid-cols-2">
            {collections.map((c) => (
              <article key={c.id}>
                <Media media={c.cover} ratio="aspect-[16/9]" className="rounded-card" sizes="(min-width: 768px) 50vw, 100vw" />
                <p className="eyebrow mt-4">
                  {c.season} · {c.productCount} {c.productCount > 1 ? "pièces" : "pièce"}
                </p>
                <h3 className="font-display text-3xl">{c.title}</h3>
                <p className="mt-1 text-ink-2">{c.description}</p>
              </article>
            ))}
          </div>
        </Container>
      )}

      <Container id="boutique" className="scroll-mt-20 py-16">
        <SectionHeader eyebrow="La boutique" title={`Toutes les pièces (${products.length})`} />
        <ProductGrid items={products} />
      </Container>

      {reviews.length > 0 && (
        <Container id="avis" className="scroll-mt-20 border-t border-line py-16">
          <SectionHeader
            eyebrow="Avis"
            title={
              <span className="flex flex-wrap items-center gap-4">
                {rating.average.toLocaleString("fr-FR")} / 5 <Stars value={rating.average} className="text-2xl" />
              </span>
            }
            intro={`${rating.count} avis d'acheteurs sur les pièces de ${creator.brandName}.`}
          />
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id} className="border-t border-line pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.authorName}</span>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-2 text-ink-2">{r.body}</p>
                <p className="eyebrow mt-2">
                  <Link href={`/produits/${r.productSlug}`} className="hover:text-ink">
                    {r.productTitle}
                  </Link>{" "}
                  · {formatDate(r.createdAt)}
                  {r.verifiedPurchase && " · Achat vérifié"}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {following.length > 0 && (
        <Container className="border-t border-line py-16">
          <SectionHeader eyebrow="Créateurs suivis" title={`${first} suit aussi`} />
          <ul className="flex flex-wrap gap-6">
            {following.map((c) => (
              <li key={c.id}>
                <Link href={`/createurs/${c.slug}`} className="group flex items-center gap-3">
                  <Avatar media={c.portrait} size={56} />
                  <span>
                    <span className="block font-display text-2xl leading-none group-hover:text-signature">{c.brandName}</span>
                    <span className="eyebrow">{c.city}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}
    </>
  );
}
