"use client";

import { useId, useState } from "react";
import { SELLER_PLANS, type SellerPlan } from "@/config/fees";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { computePayout } from "@/lib/pricing/payout";

/**
 * Simulateur réservé aux futurs créateurs : « combien me reste-t-il ? ».
 * Il n'est affiché que sur la page « Devenir créateur » et dans l'espace vendeur.
 */
export function PayoutSimulator() {
  const [price, setPrice] = useState(120);
  const [shipping, setShipping] = useState(6);
  const [plan, setPlan] = useState<SellerPlan>("launch");
  const priceId = useId();
  const shippingId = useId();

  const safe = (n: number) => (Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0);
  const r = computePayout({ itemPriceCents: safe(price), shippingCents: safe(shipping), plan });

  const row = "flex items-baseline justify-between border-b border-line py-3 text-sm";
  return (
    <div className="grid gap-8 rounded-card border border-ink bg-paper p-5 sm:p-8 lg:grid-cols-2">
      <div className="space-y-6">
        <fieldset>
          <legend className="eyebrow mb-3">Offre</legend>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {(Object.keys(SELLER_PLANS) as SellerPlan[]).map((key) => (
              <label
                key={key}
                className={cn(
                  "cursor-pointer rounded-card border p-3 text-sm transition-colors",
                  plan === key ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
                )}
              >
                <input type="radio" name="plan" value={key} checked={plan === key} onChange={() => setPlan(key)} className="sr-only" />
                <span className="block font-medium">{SELLER_PLANS[key].label}</span>
                <span className={cn("mt-1 block text-xs", plan === key ? "text-paper/70" : "text-ink-3")}>
                  {SELLER_PLANS[key].monthlyCents ? `${formatPrice(SELLER_PLANS[key].monthlyCents)} / mois` : "Sans abonnement"}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-3">{SELLER_PLANS[plan].description}</p>
        </fieldset>
        <div className="grid grid-cols-2 gap-4">
          <label htmlFor={priceId} className="text-sm">
            <span className="eyebrow mb-2 block">Prix de la pièce</span>
            <span className="flex items-center border-b border-ink">
              <input
                id={priceId}
                type="number"
                inputMode="decimal"
                min={0}
                max={10000}
                value={price}
                onChange={(e) => setPrice(e.target.valueAsNumber)}
                className="w-full bg-transparent py-2 font-display text-3xl outline-none"
              />
              <span className="font-display text-3xl">€</span>
            </span>
          </label>
          <label htmlFor={shippingId} className="text-sm">
            <span className="eyebrow mb-2 block">Livraison payée</span>
            <span className="flex items-center border-b border-ink">
              <input
                id={shippingId}
                type="number"
                inputMode="decimal"
                min={0}
                max={200}
                value={shipping}
                onChange={(e) => setShipping(e.target.valueAsNumber)}
                className="w-full bg-transparent py-2 font-display text-3xl outline-none"
              />
              <span className="font-display text-3xl">€</span>
            </span>
          </label>
        </div>
      </div>
      <div aria-live="polite">
        <p className="eyebrow">Ce qui vous revient</p>
        <p className="font-display text-display leading-none">{formatPrice(r.payoutCents)}</p>
        <div className="mt-6">
          <div className={row}>
            <span>Vente et livraison encaissées</span>
            <span>{formatPrice(r.itemPriceCents + r.shippingCents)}</span>
          </div>
          <div className={row}>
            <span>Commission Signé ({Math.round(SELLER_PLANS[plan].commissionRate * 100)} % de la pièce)</span>
            <span>− {formatPrice(r.commissionCents)}</span>
          </div>
          <div className={row}>
            <span>Frais de paiement sécurisé</span>
            <span>− {formatPrice(r.processingCents)}</span>
          </div>
          <div className={cn(row, "border-ink font-medium")}>
            <span>Versé sur votre compte</span>
            <span>{formatPrice(r.payoutCents)}</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-3">
          La livraison vous est reversée pour que vous puissiez expédier. Les montants sont indicatifs et hors TVA éventuelle sur les frais.
        </p>
      </div>
    </div>
  );
}
