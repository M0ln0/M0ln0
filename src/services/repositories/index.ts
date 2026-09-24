/**
 * Sélection de la source de données.
 *
 * SIGNE_DATA_SOURCE=demo (défaut) → données en mémoire.
 * SIGNE_DATA_SOURCE=postgres       → Supabase / PostgreSQL (Sprint 3).
 */
import * as demo from "@/data/demo";
import type { CatalogRepository } from "./catalog-repository";
import { createDemoCatalogRepository } from "./demo/catalog";

let catalog: CatalogRepository | undefined;

export function getCatalogRepository(): CatalogRepository {
  if (catalog) return catalog;
  const source = process.env.SIGNE_DATA_SOURCE ?? "demo";
  switch (source) {
    case "demo":
      catalog = createDemoCatalogRepository(demo);
      return catalog;
    default:
      throw new Error(`Source de données non prise en charge : ${source}`);
  }
}
