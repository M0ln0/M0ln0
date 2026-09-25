import { describe, expect, it } from "vitest";
import { createMemoryCommunityRepository } from "./community-repository";

describe("favoris et suivis", () => {
  it("ajoute, retire et liste les favoris du plus récent au plus ancien", async () => {
    const r = createMemoryCommunityRepository();
    await r.setFavorite("u1", "p1", true);
    await r.setFavorite("u1", "p2", true);
    expect(await r.listFavoriteProductIds("u1")).toEqual(["p2", "p1"]);
    await r.setFavorite("u1", "p1", false);
    expect(await r.listFavoriteProductIds("u1")).toEqual(["p2"]);
  });

  it("isole les utilisateurs", async () => {
    const r = createMemoryCommunityRepository();
    await r.setFavorite("u1", "p1", true);
    expect(await r.listFavoriteProductIds("u2")).toEqual([]);
  });

  it("est idempotent", async () => {
    const r = createMemoryCommunityRepository();
    await r.setFollow("u1", "c1", true);
    await r.setFollow("u1", "c1", true);
    expect(await r.countFollowers("c1")).toBe(1);
  });

  it("compte les abonnés d'un créateur", async () => {
    const r = createMemoryCommunityRepository();
    await r.setFollow("u1", "c1", true);
    await r.setFollow("u2", "c1", true);
    await r.setFollow("u2", "c1", false);
    expect(await r.countFollowers("c1")).toBe(1);
    expect(await r.listFollowedCreatorIds("u1")).toEqual(["c1"]);
  });
});
