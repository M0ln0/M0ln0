import { describe, expect, it } from "vitest";
import * as demo from "@/data/demo";
import type { Creator, Product } from "@/types/domain";
import { searchCreators, searchProducts, type CatalogData } from "./catalog-search";
import { colorFamily } from "./families";
import { parseCreatorQuery, parseProductQuery, productQueryToParams } from "./query";

const data: CatalogData = demo;
const run = (params: Record<string, string | string[]> = {}) => searchProducts(data, parseProductQuery(params, 100));

describe("jeu de démonstration", () => {
  it("contient au moins 10 créateurs, 30 produits et plusieurs écoles", () => {
    expect(demo.creators.length).toBeGreaterThanOrEqual(10);
    expect(demo.products.length).toBeGreaterThanOrEqual(30);
    expect(demo.schools.length).toBeGreaterThanOrEqual(3);
  });

  it("a des identifiants et slugs uniques", () => {
    const unique = (xs: string[]) => new Set(xs).size === xs.length;
    expect(unique(demo.products.map((p) => p.slug))).toBe(true);
    expect(unique(demo.products.flatMap((p) => p.variants.map((v) => v.id)))).toBe(true);
    expect(unique(demo.creators.map((c) => c.slug))).toBe(true);
  });

  it("relie chaque produit à un créateur et chaque créateur à une école existante", () => {
    const creatorIds = new Set(demo.creators.map((c) => c.id));
    const schoolIds = new Set(demo.schools.map((s) => s.id));
    expect(demo.products.every((p) => creatorIds.has(p.creatorId))).toBe(true);
    expect(demo.creators.every((c) => !c.schoolId || schoolIds.has(c.schoolId))).toBe(true);
  });

  it("donne une seule variante en stock unitaire à une pièce unique", () => {
    for (const p of demo.products.filter((x) => x.edition === "unique")) {
      expect(p.variants.reduce((s, v) => s + v.stock, 0)).toBeLessThanOrEqual(1);
    }
  });
});

describe("recherche de produits", () => {
  it("renvoie tout le catalogue public sans critère", () => {
    expect(run().total).toBe(demo.products.length);
  });

  it("trouve par mot-clé sans tenir compte des accents ni de la casse", () => {
    const titles = run({ q: "CERAMIQUE" }).items.map((i) => i.product.title);
    expect(titles).toContain("Bol Calanque");
    expect(run({ q: "céramiques lune" }).items.every((i) => i.creator.slug === "ceramiques-lune")).toBe(true);
  });

  it("exige que tous les mots correspondent", () => {
    expect(run({ q: "bague argent" }).items.map((i) => i.product.title)).toEqual(["Bague Goutte"]);
  });

  it("filtre par catégorie et prix", () => {
    const r = run({ categorie: "bijoux", prix_max: "100" });
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((i) => i.product.category === "bijoux" && i.product.priceCents <= 10000)).toBe(true);
  });

  it("filtre par pièce unique et série limitée", () => {
    const r = run({ edition: ["unique"] });
    expect(r.items.every((i) => i.product.edition === "unique")).toBe(true);
    const r2 = run({ edition: "unique,limited" });
    expect(r2.items.every((i) => ["unique", "limited"].includes(i.product.edition))).toBe(true);
    expect(r2.total).toBeGreaterThan(r.total);
  });

  it("filtre par taille disponible quand « disponible » est coché", () => {
    const r = run({ taille: "58", disponible: "1" });
    // La Bague Goutte en 58 est épuisée.
    expect(r.items.map((i) => i.product.title)).not.toContain("Bague Goutte");
    expect(run({ taille: "58" }).items.map((i) => i.product.title)).toContain("Bague Goutte");
  });

  it("exclut les produits épuisés en mode disponibilité", () => {
    expect(run({ disponible: "1" }).items.every((i) => i.totalStock > 0)).toBe(true);
    expect(run({ disponible: "1" }).items.map((i) => i.product.title)).not.toContain("Cabas Marché");
  });

  it("filtre par école et par ville", () => {
    const r = run({ ecole: "institut-varenne" });
    const varenne = new Set(demo.creators.filter((c) => c.schoolId === "sch-varenne").map((c) => c.slug));
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((i) => varenne.has(i.creator.slug))).toBe(true);
    expect(run({ ville: "marseille" }).items.every((i) => i.creator.city === "Marseille")).toBe(true);
  });

  it("filtre par famille de couleur et de matière", () => {
    expect(run({ couleur: "bleu" }).items.map((i) => i.product.title)).toContain("Bol Calanque");
    expect(run({ matiere: "cuir" }).items.every((i) => i.product.category === "maroquinerie")).toBe(true);
  });

  it("trie par prix croissant et décroissant", () => {
    const asc = run({ tri: "price_asc" }).items.map((i) => i.product.priceCents);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = run({ tri: "price_desc" }).items.map((i) => i.product.priceCents);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("trie par nouveauté", () => {
    const dates = run({ tri: "new" }).items.map((i) => i.product.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("pagine", () => {
    const q = parseProductQuery({ page: "2" }, 10);
    const r = searchProducts(data, q);
    expect(r.page).toBe(2);
    expect(r.items).toHaveLength(10);
    expect(r.pageCount).toBe(Math.ceil(demo.products.length / 10));
  });

  it("ramène une page hors limites à la dernière page", () => {
    const r = searchProducts(data, parseProductQuery({ page: "99" }, 10));
    expect(r.page).toBe(r.pageCount);
  });

  it("n'affiche jamais un produit non publié ni un créateur non vérifié", () => {
    const hidden: Product = { ...demo.products[0], id: "x1", slug: "x1", status: "pending_review" };
    const pending: Creator = { ...demo.creators[0], id: "cr-x", slug: "x", verification: "pending" };
    const fromPending: Product = { ...demo.products[1], id: "x2", slug: "x2", creatorId: "cr-x" };
    const r = searchProducts(
      { ...data, products: [...demo.products, hidden, fromPending], creators: [...demo.creators, pending] },
      parseProductQuery({}, 500),
    );
    expect(r.items.map((i) => i.product.id)).not.toContain("x1");
    expect(r.items.map((i) => i.product.id)).not.toContain("x2");
  });

  it("calcule des facettes cohérentes", () => {
    const { facets } = run();
    expect(facets.categories.reduce((s, c) => s + c.count, 0)).toBe(demo.products.length);
    expect(facets.sizes.slice(0, 5).map((s) => s.value)).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(facets.priceRange.min).toBeLessThan(facets.priceRange.max);
  });
});

describe("lecture des paramètres d'URL", () => {
  it("ignore les valeurs invalides", () => {
    const q = parseProductQuery({ tri: "hack", page: "-3", prix_min: "abc", edition: "rare" });
    expect(q.sort).toBe("relevance");
    expect(q.page).toBe(1);
    expect(q.minPrice).toBeUndefined();
    expect(q.editions).toEqual([]);
  });

  it("fait l'aller-retour URL → requête → URL", () => {
    const params = { q: "veste", categorie: "vetements", taille: ["S", "M"], tri: "new", disponible: "1" };
    const back = Object.fromEntries(
      [...productQueryToParams(parseProductQuery(params)).entries()].reduce((m, [k, v]) => {
        m.set(k, m.has(k) ? [...[m.get(k)!].flat(), v] : v);
        return m;
      }, new Map<string, string | string[]>()),
    );
    expect(back).toEqual(params);
  });
});

describe("recherche de créateurs", () => {
  it("trouve par nom, ville ou spécialité", () => {
    expect(searchCreators(data, parseCreatorQuery({ q: "nova" })).map((c) => c.slug)).toEqual(["atelier-nova"]);
    expect(searchCreators(data, parseCreatorQuery({ q: "maille" })).map((c) => c.slug)).toContain("fil-rouge-studio");
  });

  it("filtre les étudiants", () => {
    const r = searchCreators(data, parseCreatorQuery({ profil: "student" }));
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.stage === "student")).toBe(true);
  });

  it("filtre par univers et par école", () => {
    expect(searchCreators(data, parseCreatorQuery({ univers: "jewelry" })).every((c) => c.universes.includes("jewelry"))).toBe(true);
    expect(searchCreators(data, parseCreatorQuery({ ecole: "la-filature" })).map((c) => c.slug).sort()).toEqual([
      "fil-rouge-studio",
      "studio-halte",
    ]);
  });
});

describe("familles de couleurs", () => {
  it.each([
    ["Bleu crique", "#3E7C99", "bleu"],
    ["Noir encre", "#1C1C1E", "noir"],
    ["Écru", "#E9E1CF", "blanc"],
    ["Tomate", "#D9482B", "rouge"],
    ["Vert algue", "#5E7F6A", "vert"],
    ["Argent", "#C9CBCC", "argent"],
    ["Havane", "#6B3F22", "marron"],
    ["Assortiment", "#8C5A3C", "multicolore"],
  ])("%s → %s", (name, hex, family) => {
    expect(colorFamily(name, hex)).toBe(family);
  });
});
