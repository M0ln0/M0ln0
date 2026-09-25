import { describe, expect, it } from "vitest";
import * as demo from "@/data/demo";
import { parseProductQuery } from "@/lib/search/query";
import { createDemoCatalogRepository } from "./catalog";

const repo = createDemoCatalogRepository(demo, { now: () => new Date("2026-09-24T12:00:00Z") });

describe("dépôt catalogue démo", () => {
  it("renvoie une fiche produit complète", async () => {
    const d = await repo.getProduct(demo.products[0].slug);
    expect(d?.creator.slug).toBe("atelier-nova");
    expect(d?.moreFromCreator.every((c) => c.creator.slug === "atelier-nova")).toBe(true);
    expect(d?.related.every((c) => c.product.category === d.product.category)).toBe(true);
  });

  it("renvoie null pour un produit inconnu", async () => {
    expect(await repo.getProduct("inexistant")).toBeNull();
  });

  it("masque un produit non publié", async () => {
    const hiddenRepo = createDemoCatalogRepository({
      ...demo,
      products: demo.products.map((p, i) => (i === 0 ? { ...p, status: "hidden" as const } : p)),
    });
    expect(await hiddenRepo.getProduct(demo.products[0].slug)).toBeNull();
    const profile = await hiddenRepo.getCreatorProfile("atelier-nova");
    expect(profile?.products.map((p) => p.product.id)).not.toContain(demo.products[0].id);
  });

  it("n'affiche pas les avis masqués par la modération", async () => {
    const r = createDemoCatalogRepository({
      ...demo,
      reviews: demo.reviews.map((x) => (x.id === "rev-1" ? { ...x, status: "hidden" as const } : x)),
    });
    const p = await r.getCreatorProfile("atelier-nova");
    expect(p?.reviews.map((x) => x.id)).not.toContain("rev-1");
  });

  it("construit le profil créateur avec collections, avis et abonnements", async () => {
    const p = await repo.getCreatorProfile("atelier-nova");
    expect(p?.school?.slug).toBe("institut-varenne");
    expect(p?.collections.length).toBeGreaterThan(0);
    expect(p?.rating.count).toBeGreaterThan(0);
    expect(p?.following.map((c) => c.slug)).toContain("fil-rouge-studio");
  });

  it("prépare la découverte des créateurs", async () => {
    const d = await repo.getCreatorDiscovery();
    expect(d.selected.length).toBeGreaterThan(0);
    expect(d.students.every((c) => c.creator.stage === "student")).toBe(true);
    expect(d.emerging.every((c) => c.creator.followerCount < 3000)).toBe(true);
    expect(d.cities.reduce((s, c) => s + c.count, 0)).toBe(demo.creators.length);
  });

  it("prépare la page école", async () => {
    const s = await repo.getSchool("institut-varenne");
    expect(s?.creators.length).toBe(3);
    expect(s?.newTalents.every((c) => c.creator.stage === "student")).toBe(true);
  });

  it("recherche via le dépôt", async () => {
    const r = await repo.searchProducts(parseProductQuery({ q: "pull" }));
    expect(r.items[0].product.title).toBe("Pull Carreaux Rouges");
  });

  it("retrouve des cartes par identifiant, dans l'ordre, sans les inconnus", async () => {
    const [a, b] = demo.products;
    const cards = await repo.getProductCards([b.id, "inconnu", a.id]);
    expect(cards.map((c) => c.product.id)).toEqual([b.id, a.id]);
    const creators = await repo.getCreatorCards(["cr-kori", "cr-atelier-nova"]);
    expect(creators.map((c) => c.creator.slug)).toEqual(["kori", "atelier-nova"]);
  });

  it("liste les nouveautés des créateurs suivis", async () => {
    const r = await repo.getNewArrivalsFrom(["cr-kori"], 2);
    expect(r).toHaveLength(2);
    expect(r.every((c) => c.creator.slug === "kori")).toBe(true);
    expect(r[0].product.createdAt >= r[1].product.createdAt).toBe(true);
  });

  it("n'accepte que des produits et créateurs publics", async () => {
    expect(await repo.isPublicProduct(demo.products[0].id)).toBe(true);
    expect(await repo.isPublicProduct("prd-inexistant")).toBe(false);
    expect(await repo.isPublicCreator("cr-kori")).toBe(true);
    const hidden = createDemoCatalogRepository({ ...demo, products: demo.products.map((p, i) => (i === 0 ? { ...p, status: "hidden" as const } : p)) });
    expect(await hidden.isPublicProduct(demo.products[0].id)).toBe(false);
  });
});
