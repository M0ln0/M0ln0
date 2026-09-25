/**
 * Façade serveur du catalogue.
 *
 * Les pages et Server Actions passent toujours par ici, jamais directement
 * par les données. `server-only` empêche toute importation côté navigateur.
 * `cache` évite les lectures multiples pendant un même rendu.
 */
import "server-only";
import { cache } from "react";
import type { CreatorQuery, ProductQuery } from "@/lib/search/query";
import { getCatalogRepository } from "./repositories";

const repo = () => getCatalogRepository();

export const listCategories = cache(() => repo().listCategories());
export const searchProducts = (query: ProductQuery) => repo().searchProducts(query);
export const getProduct = cache((slug: string) => repo().getProduct(slug));
export const searchCreators = (query: CreatorQuery) => repo().searchCreators(query);
export const getCreatorProfile = cache((slug: string) => repo().getCreatorProfile(slug));
export const getCreatorDiscovery = cache(() => repo().getCreatorDiscovery());
export const listSchools = cache(() => repo().listSchools());
export const getSchool = cache((slug: string) => repo().getSchool(slug));
export const getHome = cache(() => repo().getHome());
export const listPublicSlugs = cache(() => repo().listPublicSlugs());
export const getProductCards = (ids: string[]) => repo().getProductCards(ids);
export const getCreatorCards = (ids: string[]) => repo().getCreatorCards(ids);
export const getNewArrivalsFrom = (creatorIds: string[], limit = 8) => repo().getNewArrivalsFrom(creatorIds, limit);
export const isPublicProduct = (id: string) => repo().isPublicProduct(id);
export const isPublicCreator = (id: string) => repo().isPublicCreator(id);
