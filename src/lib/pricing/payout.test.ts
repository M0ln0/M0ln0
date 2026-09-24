import { describe, expect, it } from "vitest";
import { computePayout } from "./payout";

describe("computePayout", () => {
  it("calcule le reversement d'une vente de 100 € en offre Essentiel", () => {
    const r = computePayout({ itemPriceCents: 10000, plan: "standard" });
    expect(r.commissionCents).toBe(1200);
    expect(r.processingCents).toBe(175);
    expect(r.payoutCents).toBe(8625);
  });

  it("reverse intégralement la livraison, hors frais de paiement", () => {
    const r = computePayout({ itemPriceCents: 10000, shippingCents: 600, plan: "standard" });
    expect(r.commissionCents).toBe(1200);
    expect(r.payoutCents).toBe(10600 - 1200 - (Math.round(10600 * 0.015) + 25));
  });

  it("n'est jamais négatif", () => {
    expect(computePayout({ itemPriceCents: 10, plan: "standard" }).payoutCents).toBe(0);
    expect(computePayout({ itemPriceCents: 0, plan: "standard" }).payoutCents).toBe(0);
  });

  it("refuse les montants non entiers ou négatifs", () => {
    expect(() => computePayout({ itemPriceCents: 10.5, plan: "standard" })).toThrow(RangeError);
    expect(() => computePayout({ itemPriceCents: -1, plan: "standard" })).toThrow(RangeError);
  });

  it("l'offre Fondateur laisse plus au créateur que l'offre Essentiel", () => {
    const a = computePayout({ itemPriceCents: 15000, plan: "launch" });
    const b = computePayout({ itemPriceCents: 15000, plan: "standard" });
    expect(a.payoutCents).toBeGreaterThan(b.payoutCents);
  });
});
