/**
 * Recherche en mémoire sur le catalogue.
 *
 * Utilisée par le dépôt de démonstration. En production, la même requête
 * (`ProductQuery`) sera traduite en SQL avec index plein texte PostgreSQL
 * (`tsvector` + `unaccent`). Les tests de ce module décrivent le comportement
 * attendu de toute implémentation.
 */
import type { Collection, Creator, Page, Product, ProductCardView, School } from "@/types/domain";
import { COLOR_FAMILIES, colorFamily, MATERIAL_FAMILIES, materialFamilies, type ColorFamily } from "./families";
import { normalize, tokenize } from "./normalize";
import type { CreatorQuery, ProductQuery } from "./query";

export interface CatalogData {
  products: Product[];
  creators: Creator[];
  schools: School[];
  collections: Collection[];
}

export function totalStock(p: Product): number {
  return p.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function isPubliclyVisible(p: Product, creator: Creator | undefined): boolean {
  return p.status === "published" && creator?.verification === "verified";
}

export function productColorFamilies(p: Product): ColorFamily[] {
  return [...new Set(p.colors.map((c) => colorFamily(c.name, c.hex)))];
}

export function toCardView(p: Product, creator: Creator): ProductCardView {
  return {
    product: p,
    creator: {
      id: creator.id,
      slug: creator.slug,
      brandName: creator.brandName,
      realName: creator.realName,
      city: creator.city,
      portrait: creator.portrait,
    },
    totalStock: totalStock(p),
  };
}

function relevance(tokens: string[], p: Product, c: Creator, school?: School): number {
  if (!tokens.length) return 0;
  const fields: [string, number][] = [
    [normalize(p.title), 5],
    [normalize(`${c.brandName} ${c.realName} ${c.pseudonym ?? ""}`), 4],
    [normalize(`${p.category} ${p.subcategory} ${p.materials.join(" ")} ${p.colors.map((x) => x.name).join(" ")}`), 3],
    [normalize(`${c.city} ${school?.name ?? ""} ${c.specialty}`), 2],
    [normalize(`${p.description} ${p.story ?? ""}`), 1],
  ];
  let score = 0;
  for (const t of tokens) {
    let best = 0;
    for (const [text, weight] of fields) {
      const words = text.split(" ");
      if (words.includes(t)) best = Math.max(best, weight * 2);
      else if (words.some((w) => w.startsWith(t))) best = Math.max(best, weight);
    }
    if (best === 0) return 0; // tous les mots doivent correspondre
    score += best;
  }
  return score;
}

export interface ProductFacets {
  categories: { value: string; count: number }[];
  sizes: { value: string; count: number }[];
  colors: { value: ColorFamily; label: string; count: number }[];
  materials: { value: string; label: string; count: number }[];
  cities: { value: string; count: number }[];
  schools: { value: string; label: string; count: number }[];
  creators: { value: string; label: string; count: number }[];
  priceRange: { min: number; max: number };
}

export interface ProductSearchResult extends Page<ProductCardView> {
  facets: ProductFacets;
}

function countBy<T>(items: T[], keys: (item: T) => string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) for (const k of new Set(keys(it))) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, "fr", { numeric: true });
}

export function searchProducts(data: CatalogData, query: ProductQuery): ProductSearchResult {
  const creatorsById = new Map(data.creators.map((c) => [c.id, c]));
  const schoolsById = new Map(data.schools.map((s) => [s.id, s]));
  const tokens = tokenize(query.q);

  type Row = { p: Product; c: Creator; school?: School; score: number };
  const visible: Row[] = [];
  for (const p of data.products) {
    const c = creatorsById.get(p.creatorId);
    if (!c || !isPubliclyVisible(p, c)) continue;
    const school = c.schoolId ? schoolsById.get(c.schoolId) : undefined;
    const score = relevance(tokens, p, c, school);
    if (tokens.length && score === 0) continue;
    visible.push({ p, c, school, score });
  }

  // Les facettes sont calculées sur les résultats du texte, avant les filtres,
  // pour que l'utilisateur voie toujours les options disponibles.
  const facets = buildFacets(visible.map((r) => r), data);

  const minCents = query.minPrice !== undefined ? query.minPrice * 100 : undefined;
  const maxCents = query.maxPrice !== undefined ? query.maxPrice * 100 : undefined;

  const filtered = visible.filter(({ p, c, school }) => {
    if (query.category && p.category !== query.category) return false;
    if (query.subcategory && p.subcategory !== query.subcategory) return false;
    if (minCents !== undefined && p.priceCents < minCents) return false;
    if (maxCents !== undefined && p.priceCents > maxCents) return false;
    if (query.sizes.length && !p.variants.some((v) => v.size && query.sizes.includes(v.size) && (!query.availableOnly || v.stock > 0))) return false;
    if (query.colors.length && !productColorFamilies(p).some((f) => query.colors.includes(f))) return false;
    if (query.materials.length && !materialFamilies(p.materials).some((m) => query.materials.includes(m))) return false;
    if (query.creator && c.slug !== query.creator) return false;
    if (query.school && school?.slug !== query.school) return false;
    if (query.city && normalize(c.city) !== normalize(query.city)) return false;
    if (query.editions.length && !query.editions.includes(p.edition as ProductQuery["editions"][number])) return false;
    if (query.availableOnly && totalStock(p) === 0) return false;
    return true;
  });

  const byNew = (a: Row, b: Row) => b.p.createdAt.localeCompare(a.p.createdAt);
  const sorters: Record<ProductQuery["sort"], (a: Row, b: Row) => number> = {
    relevance: (a, b) =>
      b.score - a.score ||
      // À pertinence égale : les pièces disponibles d'abord, puis les plus populaires.
      Number(totalStock(b.p) > 0) - Number(totalStock(a.p) > 0) ||
      b.p.popularity - a.p.popularity,
    new: byNew,
    popular: (a, b) => b.p.popularity - a.p.popularity || byNew(a, b),
    price_asc: (a, b) => a.p.priceCents - b.p.priceCents || byNew(a, b),
    price_desc: (a, b) => b.p.priceCents - a.p.priceCents || byNew(a, b),
  };
  filtered.sort(sorters[query.sort]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;
  const items = filtered.slice(start, start + query.pageSize).map(({ p, c }) => toCardView(p, c));

  return { items, total, page, pageSize: query.pageSize, pageCount, facets };
}

function buildFacets(rows: { p: Product; c: Creator; school?: School }[], data: CatalogData): ProductFacets {
  const cats = countBy(rows, (r) => [r.p.category]);
  const sizes = countBy(rows, (r) => r.p.sizes);
  const colors = countBy(rows, (r) => productColorFamilies(r.p));
  const mats = countBy(rows, (r) => materialFamilies(r.p.materials));
  const cities = countBy(rows, (r) => [r.c.city]);
  const schools = countBy(rows, (r) => (r.school ? [r.school.slug] : []));
  const creators = countBy(rows, (r) => [r.c.slug]);
  const prices = rows.map((r) => r.p.priceCents);
  const schoolName = new Map(data.schools.map((s) => [s.slug, s.shortName]));
  const creatorName = new Map(data.creators.map((c) => [c.slug, c.brandName]));
  return {
    categories: [...cats].map(([value, count]) => ({ value, count })),
    sizes: [...sizes].map(([value, count]) => ({ value, count })).sort((a, b) => compareSizes(a.value, b.value)),
    colors: (Object.keys(COLOR_FAMILIES) as ColorFamily[])
      .filter((k) => colors.has(k))
      .map((k) => ({ value: k, label: COLOR_FAMILIES[k], count: colors.get(k)! })),
    materials: Object.keys(MATERIAL_FAMILIES)
      .filter((k) => mats.has(k))
      .map((k) => ({ value: k, label: MATERIAL_FAMILIES[k].label, count: mats.get(k)! })),
    cities: [...cities].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value, "fr")),
    schools: [...schools].map(([value, count]) => ({ value, label: schoolName.get(value) ?? value, count })),
    creators: [...creators]
      .map(([value, count]) => ({ value, label: creatorName.get(value) ?? value, count }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    priceRange: {
      min: prices.length ? Math.floor(Math.min(...prices) / 100) : 0,
      max: prices.length ? Math.ceil(Math.max(...prices) / 100) : 0,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Créateurs                                                           */
/* ------------------------------------------------------------------ */

export function isCreatorPublic(c: Creator): boolean {
  return c.verification === "verified";
}

export function searchCreators(data: CatalogData, query: CreatorQuery): Creator[] {
  const tokens = tokenize(query.q);
  const schoolsById = new Map(data.schools.map((s) => [s.id, s]));
  const scored = data.creators
    .filter(isCreatorPublic)
    .map((c) => {
      const school = c.schoolId ? schoolsById.get(c.schoolId) : undefined;
      const haystack = normalize(
        `${c.brandName} ${c.realName} ${c.pseudonym ?? ""} ${c.city} ${c.specialty} ${c.universes.join(" ")} ${school?.name ?? ""} ${c.tagline}`,
      ).split(" ");
      const matches = tokens.every((t) => haystack.some((w) => w.startsWith(t)));
      return { c, school, matches };
    })
    .filter(({ c, school, matches }) => {
      if (!matches) return false;
      if (query.school && school?.slug !== query.school) return false;
      if (query.city && normalize(c.city) !== normalize(query.city)) return false;
      if (query.universe && !c.universes.includes(query.universe as Creator["universes"][number])) return false;
      if (query.stage && c.stage !== query.stage) return false;
      return true;
    })
    .map(({ c }) => c);

  const sorters: Record<CreatorQuery["sort"], (a: Creator, b: Creator) => number> = {
    featured: (a, b) => (b.selectedAt ?? "").localeCompare(a.selectedAt ?? "") || b.followerCount - a.followerCount,
    new: (a, b) => b.joinedAt.localeCompare(a.joinedAt),
    popular: (a, b) => b.followerCount - a.followerCount,
  };
  return scored.sort(sorters[query.sort]);
}
