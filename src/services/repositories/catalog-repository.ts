/**
 * Contrat d'accès au catalogue public.
 *
 * Deux implémentations sont prévues :
 * - `demo` : données en mémoire (`src/data/demo`), utilisée aujourd'hui ;
 * - `postgres` : Supabase / PostgreSQL (Sprint 3), mêmes signatures.
 *
 * Toutes les méthodes ne renvoient que du contenu public :
 * produits publiés de créateurs vérifiés, avis visibles.
 */
import type { ProductSearchResult } from "@/lib/search/catalog-search";
import type { CreatorQuery, ProductQuery } from "@/lib/search/query";
import type {
  Category,
  Collection,
  Creator,
  Product,
  ProductCardView,
  Review,
  School,
} from "@/types/domain";

export interface RatingSummary {
  average: number;
  count: number;
}

export interface ProductDetail {
  product: Product;
  creator: Creator;
  school?: School;
  collection?: Collection;
  reviews: Review[];
  rating: RatingSummary;
  moreFromCreator: ProductCardView[];
  related: ProductCardView[];
}

export interface CreatorCard {
  creator: Creator;
  school?: School;
  productCount: number;
  preview: ProductCardView[];
}

export interface CreatorProfile {
  creator: Creator;
  school?: School;
  collections: (Collection & { productCount: number })[];
  products: ProductCardView[];
  reviews: (Review & { productTitle: string; productSlug: string })[];
  rating: RatingSummary;
  following: Creator[];
}

export interface SchoolSummary {
  school: School;
  creatorCount: number;
  productCount: number;
}

export interface SchoolDetail {
  school: School;
  creators: CreatorCard[];
  newTalents: CreatorCard[];
  products: ProductCardView[];
  collections: (Collection & { creator: Creator })[];
}

export interface CreatorDiscovery {
  selected: CreatorCard[];
  newcomers: CreatorCard[];
  popular: CreatorCard[];
  emerging: CreatorCard[];
  students: CreatorCard[];
  cities: { city: string; count: number }[];
  universes: { universe: Creator["universes"][number]; count: number }[];
  schools: SchoolSummary[];
}

export interface HomeData {
  featuredCreators: CreatorCard[];
  newArrivals: ProductCardView[];
  collections: (Collection & { creator: Creator })[];
  schools: SchoolSummary[];
  community: { creators: number; schools: number; cities: number; pieces: number };
}

export interface CatalogRepository {
  listCategories(): Promise<Category[]>;
  searchProducts(query: ProductQuery): Promise<ProductSearchResult>;
  getProduct(slug: string): Promise<ProductDetail | null>;
  searchCreators(query: CreatorQuery): Promise<CreatorCard[]>;
  getCreatorProfile(slug: string): Promise<CreatorProfile | null>;
  getCreatorDiscovery(): Promise<CreatorDiscovery>;
  listSchools(): Promise<SchoolSummary[]>;
  getSchool(slug: string): Promise<SchoolDetail | null>;
  getHome(): Promise<HomeData>;
  /** Slugs publics, pour la génération statique et le sitemap. */
  listPublicSlugs(): Promise<{ products: string[]; creators: string[]; schools: string[] }>;
}
