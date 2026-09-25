import {
  isCreatorPublic,
  isPubliclyVisible,
  searchCreators,
  searchProducts,
  toCardView,
  totalStock,
  type CatalogData,
} from "@/lib/search/catalog-search";
import type { Creator, Product, Review } from "@/types/domain";
import type {
  CatalogRepository,
  CreatorCard,
  CreatorDiscovery,
  RatingSummary,
  SchoolSummary,
} from "../catalog-repository";

/** Date de référence pour « nouveau » et « émergent ». En base : now(). */
export interface DemoOptions {
  now?: () => Date;
}

export interface DemoDataset extends CatalogData {
  categories: import("@/types/domain").Category[];
  reviews: Review[];
}

function rating(reviews: Review[]): RatingSummary {
  if (!reviews.length) return { average: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

const DAY = 86_400_000;

export function createDemoCatalogRepository(data: DemoDataset, options: DemoOptions = {}): CatalogRepository {
  const now = options.now ?? (() => new Date());
  const creatorsById = new Map(data.creators.map((c) => [c.id, c]));
  const schoolsById = new Map(data.schools.map((s) => [s.id, s]));

  const publicCreators = () => data.creators.filter(isCreatorPublic);
  const publicProducts = () => data.products.filter((p) => isPubliclyVisible(p, creatorsById.get(p.creatorId)));
  const visibleReviews = () => {
    const visibleIds = new Set(publicProducts().map((p) => p.id));
    return data.reviews.filter((r) => r.status === "visible" && visibleIds.has(r.productId));
  };
  const card = (p: Product) => toCardView(p, creatorsById.get(p.creatorId)!);
  const byNewest = (a: Product, b: Product) => b.createdAt.localeCompare(a.createdAt);

  function creatorCard(c: Creator, previewSize = 3): CreatorCard {
    const products = publicProducts()
      .filter((p) => p.creatorId === c.id)
      .sort((a, b) => b.popularity - a.popularity);
    return {
      creator: c,
      school: c.schoolId ? schoolsById.get(c.schoolId) : undefined,
      productCount: products.length,
      preview: products.slice(0, previewSize).map(card),
    };
  }

  function schoolSummaries(): SchoolSummary[] {
    return data.schools
      .map((school) => {
        const creators = publicCreators().filter((c) => c.schoolId === school.id);
        const ids = new Set(creators.map((c) => c.id));
        return {
          school,
          creatorCount: creators.length,
          productCount: publicProducts().filter((p) => ids.has(p.creatorId)).length,
        };
      })
      .sort((a, b) => Number(b.school.partner) - Number(a.school.partner) || b.creatorCount - a.creatorCount);
  }

  const repo: CatalogRepository = {
    async listCategories() {
      return data.categories;
    },

    async searchProducts(query) {
      return searchProducts(data, query);
    },

    async getProduct(slug) {
      const product = data.products.find((p) => p.slug === slug);
      const creator = product && creatorsById.get(product.creatorId);
      if (!product || !creator || !isPubliclyVisible(product, creator)) return null;
      const reviews = visibleReviews()
        .filter((r) => r.productId === product.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const others = publicProducts().filter((p) => p.id !== product.id);
      return {
        product,
        creator,
        school: creator.schoolId ? schoolsById.get(creator.schoolId) : undefined,
        collection: data.collections.find((c) => c.id === product.collectionId),
        reviews,
        rating: rating(reviews),
        moreFromCreator: others.filter((p) => p.creatorId === creator.id).sort(byNewest).slice(0, 4).map(card),
        related: others
          .filter((p) => p.category === product.category && p.creatorId !== creator.id)
          .sort((a, b) => Number(totalStock(b) > 0) - Number(totalStock(a) > 0) || b.popularity - a.popularity)
          .slice(0, 4)
          .map(card),
      };
    },

    async searchCreators(query) {
      return searchCreators(data, query).map((c) => creatorCard(c));
    },

    async getCreatorProfile(slug) {
      const creator = data.creators.find((c) => c.slug === slug);
      if (!creator || !isCreatorPublic(creator)) return null;
      const products = publicProducts().filter((p) => p.creatorId === creator.id).sort(byNewest);
      const productIndex = new Map(products.map((p) => [p.id, p]));
      const reviews = visibleReviews()
        .filter((r) => r.creatorId === creator.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({ ...r, productTitle: productIndex.get(r.productId)!.title, productSlug: productIndex.get(r.productId)!.slug }));
      return {
        creator,
        school: creator.schoolId ? schoolsById.get(creator.schoolId) : undefined,
        collections: data.collections
          .filter((c) => c.creatorId === creator.id)
          .map((c) => ({ ...c, productCount: products.filter((p) => p.collectionId === c.id).length })),
        products: products.map(card),
        reviews,
        rating: rating(reviews),
        following: creator.followingCreatorIds
          .map((id) => creatorsById.get(id))
          .filter((c): c is Creator => !!c && isCreatorPublic(c)),
      };
    },

    async getCreatorDiscovery(): Promise<CreatorDiscovery> {
      const all = publicCreators();
      const t = now().getTime();
      const joinedWithin = (c: Creator, days: number) => t - new Date(c.joinedAt).getTime() <= days * DAY;
      const cards = (list: Creator[], n = 6) => list.slice(0, n).map((c) => creatorCard(c));
      const count = <K extends string>(keys: K[]) => {
        const m = new Map<K, number>();
        keys.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
        return [...m].sort((a, b) => b[1] - a[1]);
      };
      return {
        selected: cards(
          all.filter((c) => c.selectedAt).sort((a, b) => b.selectedAt!.localeCompare(a.selectedAt!)),
        ),
        newcomers: cards([...all].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))),
        popular: cards([...all].sort((a, b) => b.followerCount - a.followerCount)),
        // Émergent : arrivé depuis moins de 90 jours et audience encore modeste.
        emerging: cards(
          all.filter((c) => joinedWithin(c, 90) && c.followerCount < 3000).sort((a, b) => b.followerCount - a.followerCount),
        ),
        students: cards(all.filter((c) => c.stage === "student")),
        cities: count(all.map((c) => c.city)).map(([city, n]) => ({ city, count: n })),
        universes: count(all.flatMap((c) => c.universes)).map(([universe, n]) => ({ universe, count: n })),
        schools: schoolSummaries(),
      };
    },

    async listSchools() {
      return schoolSummaries();
    },

    async getSchool(slug) {
      const school = data.schools.find((s) => s.slug === slug);
      if (!school) return null;
      const creators = publicCreators().filter((c) => c.schoolId === school.id);
      const ids = new Set(creators.map((c) => c.id));
      return {
        school,
        creators: creators.sort((a, b) => b.followerCount - a.followerCount).map((c) => creatorCard(c)),
        newTalents: [...creators]
          .filter((c) => c.stage === "student")
          .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
          .map((c) => creatorCard(c)),
        products: publicProducts().filter((p) => ids.has(p.creatorId)).sort(byNewest).slice(0, 8).map(card),
        collections: data.collections
          .filter((c) => ids.has(c.creatorId))
          .map((c) => ({ ...c, creator: creatorsById.get(c.creatorId)! })),
      };
    },

    async getHome() {
      const all = publicCreators();
      const products = publicProducts();
      return {
        featuredCreators: all
          .filter((c) => c.selectedAt)
          .sort((a, b) => b.selectedAt!.localeCompare(a.selectedAt!))
          .slice(0, 4)
          .map((c) => creatorCard(c, 2)),
        newArrivals: [...products].sort(byNewest).slice(0, 8).map(card),
        collections: [...data.collections]
          .filter((c) => isCreatorPublic(creatorsById.get(c.creatorId)!))
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
          .slice(0, 3)
          .map((c) => ({ ...c, creator: creatorsById.get(c.creatorId)! })),
        schools: schoolSummaries(),
        community: {
          creators: all.length,
          schools: new Set(all.map((c) => c.schoolId).filter(Boolean)).size,
          cities: new Set(all.map((c) => c.city)).size,
          pieces: products.length,
        },
      };
    },

    async getProductCards(ids) {
      const byId = new Map(publicProducts().map((p) => [p.id, p]));
      return ids.map((id) => byId.get(id)).filter((p): p is Product => !!p).map(card);
    },

    async getCreatorCards(ids) {
      const byId = new Map(publicCreators().map((c) => [c.id, c]));
      return ids.map((id) => byId.get(id)).filter((c): c is Creator => !!c).map((c) => creatorCard(c));
    },

    async getNewArrivalsFrom(creatorIds, limit) {
      const wanted = new Set(creatorIds);
      return publicProducts().filter((p) => wanted.has(p.creatorId)).sort(byNewest).slice(0, limit).map(card);
    },

    async isPublicProduct(id) {
      return publicProducts().some((p) => p.id === id);
    },

    async isPublicCreator(id) {
      return publicCreators().some((c) => c.id === id);
    },

    async listPublicSlugs() {
      return {
        products: publicProducts().map((p) => p.slug),
        creators: publicCreators().map((c) => c.slug),
        schools: data.schools.map((s) => s.slug),
      };
    },
  };
  return repo;
}
