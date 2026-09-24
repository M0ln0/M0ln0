/**
 * Lecture sûre des paramètres d'URL de recherche.
 * Toute valeur inconnue ou invalide est ignorée plutôt que de faire échouer la page.
 */
import { z } from "zod";

export const PRODUCT_SORTS = ["relevance", "new", "popular", "price_asc", "price_desc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const PRODUCT_SORT_LABELS: Record<ProductSort, string> = {
  relevance: "Pertinence",
  new: "Nouveautés",
  popular: "Popularité",
  price_asc: "Prix croissant",
  price_desc: "Prix décroissant",
};

export const EDITION_FILTERS = ["unique", "limited", "made_to_order"] as const;

export interface ProductQuery {
  q: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  materials: string[];
  creator?: string;
  school?: string;
  city?: string;
  editions: (typeof EDITION_FILTERS)[number][];
  availableOnly: boolean;
  sort: ProductSort;
  page: number;
  pageSize: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean).slice(0, 20);

const one = (v: string | string[] | undefined): string | undefined => {
  const x = Array.isArray(v) ? v[0] : v;
  return x && x.trim() ? x.trim().slice(0, 120) : undefined;
};

const euros = z.coerce.number().int().min(0).max(100_000);

export function parseProductQuery(params: RawParams, pageSize = 24): ProductQuery {
  const sort = one(params.tri);
  const page = z.coerce.number().int().min(1).max(500).safeParse(one(params.page) ?? "1");
  const min = euros.safeParse(one(params.prix_min));
  const max = euros.safeParse(one(params.prix_max));
  return {
    q: (one(params.q) ?? "").slice(0, 80),
    category: one(params.categorie),
    subcategory: one(params.sous_categorie),
    minPrice: one(params.prix_min) && min.success ? min.data : undefined,
    maxPrice: one(params.prix_max) && max.success ? max.data : undefined,
    sizes: list(params.taille),
    colors: list(params.couleur),
    materials: list(params.matiere),
    creator: one(params.createur),
    school: one(params.ecole),
    city: one(params.ville),
    editions: list(params.edition).filter((e): e is ProductQuery["editions"][number] =>
      (EDITION_FILTERS as readonly string[]).includes(e),
    ),
    availableOnly: one(params.disponible) === "1",
    sort: PRODUCT_SORTS.includes(sort as ProductSort) ? (sort as ProductSort) : "relevance",
    page: page.success ? page.data : 1,
    pageSize,
  };
}

/** Reconstruit une URL de recherche à partir d'une requête, en omettant les valeurs par défaut. */
export function productQueryToParams(q: Partial<ProductQuery>): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.category) p.set("categorie", q.category);
  if (q.subcategory) p.set("sous_categorie", q.subcategory);
  if (q.minPrice !== undefined) p.set("prix_min", String(q.minPrice));
  if (q.maxPrice !== undefined) p.set("prix_max", String(q.maxPrice));
  q.sizes?.forEach((v) => p.append("taille", v));
  q.colors?.forEach((v) => p.append("couleur", v));
  q.materials?.forEach((v) => p.append("matiere", v));
  if (q.creator) p.set("createur", q.creator);
  if (q.school) p.set("ecole", q.school);
  if (q.city) p.set("ville", q.city);
  q.editions?.forEach((v) => p.append("edition", v));
  if (q.availableOnly) p.set("disponible", "1");
  if (q.sort && q.sort !== "relevance") p.set("tri", q.sort);
  if (q.page && q.page > 1) p.set("page", String(q.page));
  return p;
}

export const CREATOR_SORTS = ["featured", "new", "popular"] as const;
export type CreatorSort = (typeof CREATOR_SORTS)[number];

export interface CreatorQuery {
  q: string;
  school?: string;
  city?: string;
  universe?: string;
  stage?: string;
  sort: CreatorSort;
}

export function parseCreatorQuery(params: RawParams): CreatorQuery {
  const sort = one(params.tri);
  return {
    q: (one(params.q) ?? "").slice(0, 80),
    school: one(params.ecole),
    city: one(params.ville),
    universe: one(params.univers),
    stage: one(params.profil),
    sort: CREATOR_SORTS.includes(sort as CreatorSort) ? (sort as CreatorSort) : "featured",
  };
}
