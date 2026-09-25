/**
 * Modèle de domaine de Signé.
 *
 * Ces types sont le contrat entre l'interface et la couche de données.
 * Ils reflètent le schéma PostgreSQL de `db/migrations` : quand la source
 * de données passera de la démo à Supabase, seuls les dépôts changent.
 *
 * Conventions :
 * - les montants sont en centimes d'euro (entiers) pour éviter les flottants ;
 * - les dates sont des chaînes ISO 8601 ;
 * - les identifiants sont des chaînes opaques (UUID en base).
 */

export type ID = string;
export type ISODate = string;
export type Cents = number;

/* ------------------------------------------------------------------ */
/* Comptes, rôles                                                      */
/* ------------------------------------------------------------------ */

/** Type de compte public. Choisi à l'inscription, jamais « admin ». */
export type AccountType = "buyer" | "creator" | "business";

/**
 * Rôles d'administration. Ils sont stockés dans une table séparée
 * (`admin_members`) que seul un super admin peut modifier côté serveur.
 */
export type AdminRole =
  | "super_admin"
  | "moderator"
  | "support"
  | "finance"
  | "analyst";

export type AccountStatus =
  | "pending_verification"
  | "active"
  | "restricted"
  | "suspended"
  | "banned";

export interface User {
  id: ID;
  email: string;
  displayName: string;
  accountType: AccountType;
  status: AccountStatus;
  emailVerified: boolean;
  city?: string;
  createdAt: ISODate;
  lastActiveAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Médias                                                              */
/* ------------------------------------------------------------------ */

export type MediaKind = "main" | "detail" | "worn" | "alternate" | "atelier" | "portrait" | "cover";

/**
 * Une image. `src` est vide tant qu'aucune photo réelle n'est fournie :
 * l'interface affiche alors un visuel génératif dérivé de `seed`.
 * Remplacer une image revient à renseigner `src` (URL CDN ou chemin /public).
 */
export interface Media {
  id: ID;
  src?: string;
  alt: string;
  kind: MediaKind;
  /** Graine du visuel génératif, stable pour un même objet. */
  seed: string;
  width?: number;
  height?: number;
  position: number;
}

/* ------------------------------------------------------------------ */
/* Écoles, créateurs, collections                                      */
/* ------------------------------------------------------------------ */

export type SchoolKind = "mode" | "design" | "arts_appliques" | "beaux_arts";

export interface School {
  id: ID;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  kind: SchoolKind;
  description: string;
  cover: Media;
  partner: boolean;
}

export type CreatorStage = "student" | "graduate" | "independent_brand";

export type CreatorVerification =
  | "pending"
  | "verified"
  | "changes_requested"
  | "rejected";

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  website?: string;
}

export interface Creator {
  id: ID;
  userId: ID;
  slug: string;
  /** Nom de marque ou d'atelier affiché. */
  brandName: string;
  /** Nom de la personne. */
  realName: string;
  pseudonym?: string;
  portrait: Media;
  cover: Media;
  atelier?: Media;
  tagline: string;
  bio: string;
  story: string;
  /** Pourquoi cette personne crée. */
  motivation: string;
  schoolId?: ID;
  graduationYear?: number;
  stage: CreatorStage;
  city: string;
  specialty: string;
  universes: Universe[];
  socials: SocialLinks;
  /** Le créateur choisit d'afficher ou non ses réseaux. */
  showSocials: boolean;
  followerCount: number;
  followingCreatorIds: ID[];
  verification: CreatorVerification;
  /** Sélection éditoriale Signé, date de mise en avant. */
  selectedAt?: ISODate;
  /** Créateur fondateur ayant rejoint le lancement. */
  launchPartner: boolean;
  joinedAt: ISODate;
}

export type Universe =
  | "upcycling"
  | "tailoring"
  | "knitwear"
  | "streetwear"
  | "jewelry"
  | "leather"
  | "ceramics"
  | "print"
  | "furniture"
  | "textile_art"
  | "minimalism"
  | "romantic";

export interface Collection {
  id: ID;
  slug: string;
  creatorId: ID;
  title: string;
  season: string;
  description: string;
  cover: Media;
  publishedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export type CategorySlug =
  | "vetements"
  | "accessoires"
  | "bijoux"
  | "maroquinerie"
  | "objets"
  | "maison"
  | "art-print";

export interface Category {
  slug: CategorySlug;
  label: string;
  subcategories: { slug: string; label: string }[];
}

/**
 * - unique : une seule pièce existe ;
 * - limited : série numérotée de `editionSize` pièces ;
 * - made_to_order : fabriquée à la commande, délai `leadTimeDays` ;
 * - ongoing : production continue en petite quantité.
 */
export type Edition = "unique" | "limited" | "made_to_order" | "ongoing";

export type ProductStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "published"
  | "hidden"
  | "rejected";

export interface Color {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: ID;
  productId: ID;
  sku: string;
  size?: string;
  color?: string;
  /** Prix spécifique à la variante, sinon le prix du produit. */
  priceCents?: Cents;
  stock: number;
}

export interface Product {
  id: ID;
  slug: string;
  creatorId: ID;
  collectionId?: ID;
  title: string;
  description: string;
  story?: string;
  category: CategorySlug;
  subcategory: string;
  priceCents: Cents;
  images: Media[];
  materials: string[];
  colors: Color[];
  sizes: string[];
  variants: ProductVariant[];
  edition: Edition;
  editionSize?: number;
  leadTimeDays?: number;
  status: ProductStatus;
  /** Score agrégé (vues, favoris, ventes) calculé côté serveur. */
  popularity: number;
  favoriteCount: number;
  createdAt: ISODate;
}

export interface Review {
  id: ID;
  productId: ID;
  creatorId: ID;
  authorId: ID;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  verifiedPurchase: boolean;
  status: "visible" | "hidden";
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Vues composées utilisées par l'interface                            */
/* ------------------------------------------------------------------ */

export interface ProductCardView {
  product: Product;
  creator: Pick<Creator, "id" | "slug" | "brandName" | "realName" | "city" | "portrait">;
  totalStock: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
