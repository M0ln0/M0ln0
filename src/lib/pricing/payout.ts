import { PAYMENT_PROCESSING, SELLER_PLANS, type SellerPlan } from "@/config/fees";
import type { Cents } from "@/types/domain";

export interface PayoutInput {
  /** Prix de vente de l'article, TTC, en centimes. */
  itemPriceCents: Cents;
  /** Livraison payée par l'acheteur et reversée intégralement au créateur. */
  shippingCents?: Cents;
  plan: SellerPlan;
}

export interface PayoutBreakdown {
  itemPriceCents: Cents;
  shippingCents: Cents;
  commissionCents: Cents;
  processingCents: Cents;
  payoutCents: Cents;
  /** Part du prix de l'article qui revient au créateur (0..1). */
  keepRate: number;
}

/**
 * Calcule ce qu'il reste au créateur sur une vente.
 * La commission porte sur l'article, les frais de paiement sur le total encaissé.
 * Arrondis au centime le plus proche, jamais de montant négatif.
 */
export function computePayout({ itemPriceCents, shippingCents = 0, plan }: PayoutInput): PayoutBreakdown {
  if (!Number.isInteger(itemPriceCents) || itemPriceCents < 0) {
    throw new RangeError("itemPriceCents doit être un entier positif");
  }
  if (!Number.isInteger(shippingCents) || shippingCents < 0) {
    throw new RangeError("shippingCents doit être un entier positif");
  }
  const fees = SELLER_PLANS[plan];
  const charged = itemPriceCents + shippingCents;
  const commissionCents = Math.round(itemPriceCents * fees.commissionRate);
  const processingCents = charged === 0 ? 0 : Math.round(charged * PAYMENT_PROCESSING.rate) + PAYMENT_PROCESSING.fixedCents;
  const payoutCents = Math.max(0, charged - commissionCents - processingCents);
  const keepRate = itemPriceCents === 0 ? 0 : (payoutCents - shippingCents) / itemPriceCents;
  return {
    itemPriceCents,
    shippingCents,
    commissionCents,
    processingCents,
    payoutCents,
    keepRate: Math.max(0, keepRate),
  };
}
