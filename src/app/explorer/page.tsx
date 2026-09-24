import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Container, EmptyState, Pagination } from "@/components/ui/primitives";
import { CreatorCard } from "@/features/creators/creator-card";
import { ProductGrid } from "@/features/marketplace/product-card";
import { SearchFilters, SortForm } from "@/features/marketplace/search-filters";
import { cn } from "@/lib/cn";
import { COLOR_FAMILIES, MATERIAL_FAMILIES, type ColorFamily } from "@/lib/search/families";
import { parseCreatorQuery, parseProductQuery, productQueryToParams, type ProductQuery } from "@/lib/search/query";
import { EDITION_LABELS } from "@/lib/labels";
import { listCategories, searchCreators, searchProducts } from "@/services/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/explorer">): Promise<Metadata> {
  const q = parseProductQuery(await searchParams);
  return {
    title: q.q ? `« ${q.q} »` : "Explorer",
    description: "Pièces uniques, séries limitées et créations de jeunes créateurs indépendants.",
  };
}

function hrefWith(q: ProductQuery, patch: Partial<ProductQuery>) {
  const qs = productQueryToParams({ ...q, page: 1, ...patch }).toString();
  return qs ? `/explorer?${qs}` : "/explorer";
}

export default async function ExplorerPage({ searchParams }: PageProps<"/explorer">) {
  const params = await searchParams;
  const view = params.vue === "createurs" ? "createurs" : "pieces";
  const query = parseProductQuery(params);
  const [result, categories, creators] = await Promise.all([
    searchProducts(query),
    listCategories(),
    searchCreators(parseCreatorQuery({ q: query.q })),
  ]);
  const formKey = productQueryToParams(query).toString();
  const catLabel = new Map(categories.map((c) => [c.slug, c.label]));

  // Puces des filtres actifs, chacune avec son lien de retrait.
  const chips: { label: string; href: string }[] = [];
  if (query.category) chips.push({ label: catLabel.get(query.category as never) ?? query.category, href: hrefWith(query, { category: undefined, subcategory: undefined }) });
  if (query.subcategory) {
    const sub = categories.flatMap((c) => c.subcategories).find((s) => s.slug === query.subcategory);
    chips.push({ label: sub?.label ?? query.subcategory, href: hrefWith(query, { subcategory: undefined }) });
  }
  if (query.availableOnly) chips.push({ label: "Disponible", href: hrefWith(query, { availableOnly: false }) });
  query.editions.forEach((e) => chips.push({ label: EDITION_LABELS[e], href: hrefWith(query, { editions: query.editions.filter((x) => x !== e) }) }));
  if (query.minPrice !== undefined) chips.push({ label: `Dès ${query.minPrice} €`, href: hrefWith(query, { minPrice: undefined }) });
  if (query.maxPrice !== undefined) chips.push({ label: `Jusqu'à ${query.maxPrice} €`, href: hrefWith(query, { maxPrice: undefined }) });
  query.sizes.forEach((s) => chips.push({ label: `Taille ${s}`, href: hrefWith(query, { sizes: query.sizes.filter((x) => x !== s) }) }));
  query.colors.forEach((c) => chips.push({ label: COLOR_FAMILIES[c as ColorFamily] ?? c, href: hrefWith(query, { colors: query.colors.filter((x) => x !== c) }) }));
  query.materials.forEach((m) => chips.push({ label: MATERIAL_FAMILIES[m]?.label ?? m, href: hrefWith(query, { materials: query.materials.filter((x) => x !== m) }) }));
  if (query.creator) chips.push({ label: result.facets.creators.find((c) => c.value === query.creator)?.label ?? query.creator, href: hrefWith(query, { creator: undefined }) });
  if (query.school) chips.push({ label: result.facets.schools.find((s) => s.value === query.school)?.label ?? query.school, href: hrefWith(query, { school: undefined }) });
  if (query.city) chips.push({ label: query.city, href: hrefWith(query, { city: undefined }) });

  const title = query.q
    ? `« ${query.q} »`
    : query.sort === "new"
      ? "Nouveautés"
      : query.category
        ? (catLabel.get(query.category as never) ?? "Explorer")
        : "Explorer";

  return (
    <Container className="py-10">
      <header className="border-b border-line pb-6">
        <p className="eyebrow">{query.q ? "Recherche" : "Catalogue"}</p>
        <h1 className="mt-2 font-display text-headline">{title}</h1>
        <form action="/explorer" role="search" className="mt-6 flex max-w-xl gap-2">
          <label htmlFor="q" className="sr-only">
            Rechercher
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query.q}
            placeholder="Une pièce, une matière, un créateur, une école…"
            className="h-12 min-w-0 flex-1 rounded-full border border-ink bg-paper px-5 outline-none"
          />
          {view === "createurs" && <input type="hidden" name="vue" value="createurs" />}
          <button className="h-12 rounded-full bg-ink px-6 text-sm font-medium text-paper">Chercher</button>
        </form>
        <nav aria-label="Type de résultats" className="mt-6 flex gap-6 text-sm">
          {[
            { key: "pieces", label: "Pièces", count: result.total, href: hrefWith(query, {}) },
            {
              key: "createurs",
              label: "Créateurs",
              count: creators.length,
              href: `/explorer?vue=createurs${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}`,
            },
          ].map((t) => (
            <Link key={t.key} href={t.href} aria-current={view === t.key ? "page" : undefined} className={cn("border-b-2 pb-2", view === t.key ? "border-ink font-medium" : "border-transparent text-ink-3 hover:text-ink")}>
              {t.label} <span className="font-mono text-xs">{t.count}</span>
            </Link>
          ))}
        </nav>
        {view === "pieces" && (
          <div className="scroll-row -mx-4 mt-4 auto-cols-max gap-2 px-4 sm:mx-0 sm:px-0">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={hrefWith(query, { category: query.category === c.slug ? undefined : c.slug, subcategory: undefined })}
                className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm", query.category === c.slug ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {view === "createurs" ? (
        <section className="pt-10">
          {creators.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {creators.map((c) => (
                <CreatorCard key={c.creator.id} data={c} />
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun créateur ne correspond." action={<ButtonLink href="/createurs">Découvrir tous les créateurs</ButtonLink>}>
              Essayez un nom de ville, une spécialité ou le nom d&apos;une école.
            </EmptyState>
          )}
        </section>
      ) : (
        <div className="grid gap-10 pt-6 lg:grid-cols-[260px_1fr]">
          <aside>
            <details className="group lg:hidden">
              <summary className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-ink text-sm font-medium">
                Filtres {chips.length > 0 && <span className="font-mono text-xs">({chips.length})</span>}
              </summary>
              <div className="mt-2">
                <SearchFilters key={formKey} query={query} facets={result.facets} categories={categories} />
              </div>
            </details>
            <div className="hidden lg:block">
              <SearchFilters key={formKey} query={query} facets={result.facets} categories={categories} />
            </div>
          </aside>
          <section aria-label="Résultats">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-ink-3" aria-live="polite">
                {result.total} {result.total > 1 ? "pièces" : "pièce"}
              </p>
              <SortForm key={formKey} query={query} />
            </div>
            {chips.length > 0 && (
              <ul className="mb-6 flex flex-wrap gap-2" aria-label="Filtres actifs">
                {chips.map((c) => (
                  <li key={c.label + c.href}>
                    <Link href={c.href} className="inline-flex items-center gap-2 rounded-full bg-paper-2 px-3 py-1 text-sm hover:bg-paper-3">
                      {c.label} <span aria-label="Retirer">×</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {result.total ? (
              <>
                <ProductGrid items={result.items} priorityCount={4} />
                <Pagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => {
                  const qs = productQueryToParams({ ...query, page: p }).toString();
                  return qs ? `/explorer?${qs}` : "/explorer";
                }} />
              </>
            ) : (
              <EmptyState title="Rien pour l'instant." action={<ButtonLink href="/explorer" variant="outline">Tout le catalogue</ButtonLink>}>
                Aucune pièce ne correspond à ces critères. Retirez un filtre, ou cherchez du côté des créateurs.
              </EmptyState>
            )}
          </section>
        </div>
      )}
    </Container>
  );
}
