/**
 * Paramètres économiques internes.
 *
 * Ces valeurs ne sont affichées que dans l'espace vendeur, le simulateur
 * « Devenir créateur », l'administration et les pages tarifaires.
 * Elles ne doivent jamais apparaître dans le parcours acheteur.
 *
 * Les taux ci-dessous sont des hypothèses de travail à valider.
 */

export type SellerPlan = "launch" | "standard" | "studio";

export interface PlanFees {
  label: string;
  /** Abonnement mensuel en centimes. */
  monthlyCents: number;
  /** Commission Signé sur le prix de l'article (hors livraison). */
  commissionRate: number;
  description: string;
}

export const SELLER_PLANS: Record<SellerPlan, PlanFees> = {
  launch: {
    label: "Fondateur",
    monthlyCents: 0,
    commissionRate: 0.08,
    description: "Pour les créateurs du lancement et les étudiants des écoles partenaires.",
  },
  standard: {
    label: "Essentiel",
    monthlyCents: 0,
    commissionRate: 0.12,
    description: "Sans abonnement. Vous payez uniquement quand vous vendez.",
  },
  studio: {
    label: "Studio",
    monthlyCents: 1900,
    commissionRate: 0.07,
    description: "Pour les marques qui vendent régulièrement.",
  },
};

/** Frais du prestataire de paiement, refacturés au coût réel. */
export const PAYMENT_PROCESSING = {
  rate: 0.015,
  fixedCents: 25,
};
