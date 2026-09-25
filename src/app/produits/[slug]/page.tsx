import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Media } from "@/components/ui/media";
import { Badge, ButtonLink, Container, SectionHeader, Stars } from "@/components/ui/primitives";
import { ShareMenu } from "@/features/community/share-menu";
import { ProductGrid } from "@/features/marketplace/product-card";
import { cn } from "@/lib/cn";
import { formatCount, formatDate, formatPrice } from "@/lib/format";
import { EDITION_LABELS, editionDetail, STAGE_LABELS } from "@/lib/labels";
import { totalStock } from "@/lib/search/catalog-search";
import { getProduct, listCategories, listPublicSlugs } from "@/services/catalog";

export async function generateStaticParams() {
  const { products } = await listPublicSlugs();
  return products.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/produits/[slug]">): Promise<Metadata> {
  const detail = await getProduct((await params).slug);
  if (!detail) return {};
  return {
    title: `${detail.product.title} — ${detail.creator.brandName}`,
    description: detail.product.description,
  };
}

const KIND_LABEL = { main: "Vue principale", detail: "Détail", worn: "Porté", alternate: "Autre vue", atelier: "Atelier", portrait: "Portrait", cover: "Couverture" } as const;

export default async function ProductPage({ params }: PageProps<"/produits/[slug]">) {
  const [detail, categories] = await Promise.all([getProduct((await params).slug), listCategories()]);
  if (!detail) notFound();
  const { product, creator, school, collection, reviews, rating, moreFromCreator, related } = detail;
  const stock = totalStock(product);
  const hint = { subcategory: product.subcategory, tint: product.colors[0]?.hex };
  const hasSizes = product.sizes.length > 0;
  const multiColor = product.colors.length > 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    brand: { "@type": "Brand", name: creator.brandName },
    material: product.materials.join(", "),
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (product.priceCents / 100).toFixed(2),
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    ...(rating.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="py-6 sm:py-10">
        <nav aria-label="Fil d'Ariane" className="eyebrow mb-6 flex flex-wrap gap-2">
          <Link href="/explorer" className="hover:text-ink">Explorer</Link>
          <span aria-hidden>/</span>
          <Link href={`/explorer?categorie=${product.category}`} className="hover:text-ink">
            {categories.find((c) => c.slug === product.category)?.label ?? product.category}
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/createurs/${creator.slug}`} className="hover:text-ink">{creator.brandName}</Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          {/* Galerie : défilement horizontal sur mobile, colonne sur grand écran */}
          <section aria-label="Photos">
            <div className="scroll-row -mx-4 auto-cols-[88%] gap-2 px-4 sm:mx-0 sm:auto-cols-[60%] sm:px-0 lg:grid-flow-row lg:grid-cols-2 lg:overflow-visible">
              {product.images.map((m, i) => (
                <figure key={m.id} className={cn(i === 0 && "lg:col-span-2")}>
                  <Media media={m} hint={hint} priority={i === 0} ratio={i === 0 ? "aspect-[4/5] lg:aspect-[5/4]" : "aspect-[4/5]"} className="rounded-card" sizes="(min-width: 1024px) 55vw, 90vw" />
                  <figcaption className="eyebrow mt-2">{KIND_LABEL[m.kind]}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* Informations */}
          <section className="lg:sticky lg:top-24 lg:self-start">
            <Link href={`/createurs/${creator.slug}`} className="group flex items-center gap-3">
              <Avatar media={creator.portrait} size={44} />
              <span>
                <span className="block font-medium group-hover:underline">{creator.brandName}</span>
                <span className="block text-xs text-ink-3">
                  {creator.realName} · {creator.city}
                </span>
              </span>
            </Link>
            <h1 className="mt-6 font-display text-headline">{product.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-2xl">{formatPrice(product.priceCents)}</span>
              <Badge tone={product.edition === "unique" ? "ink" : "neutral"}>{editionDetail(product)}</Badge>
              {rating.count > 0 && (
                <a href="#avis" className="flex items-center gap-1 text-sm">
                  <Stars value={rating.average} /> <span className="text-ink-3">({rating.count})</span>
                </a>
              )}
            </div>

            <p className="mt-6 text-ink-2">{product.description}</p>

            {/* Disponibilité par variante */}
            <div className="mt-8 space-y-5">
              {multiColor && (
                <div>
                  <p className="eyebrow mb-2">Couleurs</p>
                  <ul className="flex flex-wrap gap-3">
                    {product.colors.map((c) => {
                      const left = product.variants.filter((v) => v.color === c.name).reduce((s, v) => s + v.stock, 0);
                      return (
                        <li key={c.name} className={cn("flex items-center gap-2 text-sm", left === 0 && "text-ink-3 line-through")}>
                          <span className="h-5 w-5 rounded-full border border-line" style={{ background: c.hex }} />
                          {c.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {hasSizes && (
                <div>
                  <p className="eyebrow mb-2">Tailles disponibles</p>
                  <ul className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const left = product.variants.filter((v) => v.size === s).reduce((sum, v) => sum + v.stock, 0);
                      return (
                        <li
                          key={s}
                          className={cn("grid h-10 min-w-12 place-items-center rounded-full border px-3 text-sm", left ? "border-ink" : "border-line text-ink-3 line-through")}
                          aria-label={`Taille ${s} : ${left ? "disponible" : "épuisée"}`}
                        >
                          {s}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <p className={cn("text-sm", stock ? "text-success" : "text-ink-3")}>
                {stock === 0
                  ? "Épuisée pour le moment. Suivez le créateur pour être prévenu du réassort."
                  : product.edition === "unique"
                    ? "Pièce unique : un seul exemplaire existe."
                    : product.edition === "made_to_order"
                      ? `Fabriquée pour vous en ${product.leadTimeDays} jours.`
                      : stock <= 3
                        ? `Plus que ${stock} ${stock > 1 ? "pièces" : "pièce"}.`
                        : "Disponible, expédiée par le créateur."}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ShareMenu path={`/produits/${product.slug}`} title={product.title} text={`${product.title} par ${creator.brandName} sur Signé`} />
            </div>

            <dl className="mt-10 divide-y divide-line border-y border-line text-sm">
              {[
                ["Matières", product.materials.join(", ")],
                ["Couleur", product.colors.map((c) => c.name).join(", ")],
                ["Édition", EDITION_LABELS[product.edition] + (product.editionSize ? `, ${product.editionSize} exemplaires` : "")],
                ...(product.leadTimeDays ? [["Délai de fabrication", `${product.leadTimeDays} jours`]] : []),
                ...(collection ? [["Collection", `${collection.title} · ${collection.season}`]] : []),
                ["Expédition", "Préparée et envoyée par le créateur. Chaque créateur expédie séparément."],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-ink-3">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {product.story && (
              <p className="mt-6 border-l-2 border-signature pl-4 font-display text-xl leading-snug">{product.story}</p>
            )}
          </section>
        </div>
      </Container>

      {/* Le créateur, aussi important que la pièce */}
      <section className="mt-16 bg-paper-2 py-16">
        <Container className="grid items-center gap-10 md:grid-cols-[280px_1fr]">
          <Media media={creator.portrait} ratio="aspect-[4/5]" className="rounded-card" sizes="280px" />
          <div>
            <p className="eyebrow">
              Derrière cette pièce · {STAGE_LABELS[creator.stage]}
              {school ? ` · ${school.name}` : ""}
            </p>
            <h2 className="mt-2 font-display text-headline">{creator.brandName}</h2>
            <p className="mt-4 max-w-2xl font-display text-2xl leading-snug">« {creator.motivation} »</p>
            <p className="mt-4 max-w-2xl text-ink-2">{creator.bio}</p>
            <p className="mt-4 font-mono text-xs text-ink-3">{formatCount(creator.followerCount)} abonnés</p>
            <ButtonLink href={`/createurs/${creator.slug}`} variant="outline" className="mt-6">
              Découvrir {creator.realName.split(" ")[0]}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Container>
        {reviews.length > 0 && (
          <section id="avis" className="scroll-mt-24 py-16">
            <SectionHeader eyebrow="Avis" title={`${rating.average.toLocaleString("fr-FR")} / 5 · ${rating.count} avis`} />
            <ul className="grid gap-6 md:grid-cols-2">
              {reviews.map((r) => (
                <li key={r.id} className="border-t border-line pt-4">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{r.authorName}</span>
                    <Stars value={r.rating} />
                  </div>
                  <p className="mt-2 text-ink-2">{r.body}</p>
                  <p className="eyebrow mt-2">
                    {formatDate(r.createdAt)}
                    {r.verifiedPurchase && " · Achat vérifié"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {moreFromCreator.length > 0 && (
          <section className="py-16">
            <SectionHeader eyebrow={creator.brandName} title="Du même atelier" action={{ href: `/createurs/${creator.slug}`, label: "Toute la boutique" }} />
            <ProductGrid items={moreFromCreator} />
          </section>
        )}
        {related.length > 0 && (
          <section className="py-16">
            <SectionHeader eyebrow="D'autres créateurs" title="Dans le même esprit" />
            <ProductGrid items={related} />
          </section>
        )}
      </Container>
    </>
  );
}
