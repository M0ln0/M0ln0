/**
 * Permissions de Signé.
 *
 * Ce module est la source unique de vérité pour « qui peut faire quoi ».
 * Il est pur (aucune dépendance réseau) pour être testé exhaustivement,
 * et il est appelé uniquement côté serveur : pages serveur, Server Actions,
 * route handlers. Le frontend peut s'en servir pour masquer un bouton,
 * jamais pour autoriser une action.
 *
 * Principe du moindre privilège : chaque rôle reçoit la liste explicite
 * de ce dont il a besoin. Aucune permission par défaut.
 */

import type { AccountStatus, AccountType, AdminRole, ID } from "@/types/domain";

export const ADMIN_PERMISSIONS = [
  "admin.access",
  "admin.search",
  // Comptes
  "users.read",
  "users.read_contact",
  "users.suspend",
  "users.export",
  // Créateurs, produits, avis, signalements
  "creators.verify",
  "products.moderate",
  "reviews.moderate",
  "reports.handle",
  "sanctions.apply",
  "sanctions.review_appeal",
  // Commandes, support, litiges
  "orders.read",
  "orders.intervene",
  "tickets.read",
  "tickets.reply",
  "tickets.internal_notes",
  "disputes.read",
  "disputes.decide",
  // Argent
  "refunds.issue",
  "finance.read",
  "finance.export",
  // Pilotage
  "analytics.read",
  "alerts.read",
  "security.manage",
  "audit.read",
  "settings.manage",
  "admins.manage",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super admin",
  moderator: "Modération",
  support: "Support",
  finance: "Finance",
  analyst: "Analyse",
};

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: ADMIN_PERMISSIONS,
  moderator: [
    "admin.access",
    "admin.search",
    "users.read",
    "creators.verify",
    "products.moderate",
    "reviews.moderate",
    "reports.handle",
    "sanctions.apply",
    "alerts.read",
  ],
  support: [
    "admin.access",
    "admin.search",
    "users.read",
    "users.read_contact",
    "orders.read",
    "orders.intervene",
    "tickets.read",
    "tickets.reply",
    "tickets.internal_notes",
    "disputes.read",
    "disputes.decide",
  ],
  finance: [
    "admin.access",
    "admin.search",
    "orders.read",
    "disputes.read",
    "refunds.issue",
    "finance.read",
    "finance.export",
  ],
  // L'analyste ne voit que des agrégats : aucune donnée nominative.
  analyst: ["admin.access", "analytics.read"],
};

/**
 * Identité résolue côté serveur à partir de la session.
 * `adminRole` provient de la table `admin_members`, jamais d'un cookie
 * ni d'un champ envoyé par le navigateur.
 */
export interface Actor {
  userId: ID;
  accountType: AccountType;
  status: AccountStatus;
  adminRole: AdminRole | null;
  /** La double authentification a été validée pour cette session. */
  mfaVerified: boolean;
}

export type Anonymous = null;

const BLOCKED_STATUSES: readonly AccountStatus[] = ["suspended", "banned"];

/** Un compte suspendu ou banni ne possède plus aucune permission. */
export function isBlocked(actor: Actor): boolean {
  return BLOCKED_STATUSES.includes(actor.status);
}

/**
 * Vérifie une permission d'administration.
 * Exige : compte actif, rôle admin attribué côté serveur, 2FA validée.
 */
export function can(actor: Actor | Anonymous, permission: AdminPermission): boolean {
  if (!actor) return false;
  if (isBlocked(actor)) return false;
  if (!actor.adminRole) return false;
  if (!actor.mfaVerified) return false;
  return ROLE_PERMISSIONS[actor.adminRole].includes(permission);
}

export class ForbiddenError extends Error {
  readonly permission: string;
  constructor(permission: string) {
    super(`Accès refusé : ${permission}`);
    this.name = "ForbiddenError";
    this.permission = permission;
  }
}

export function assertCan(actor: Actor | Anonymous, permission: AdminPermission): asserts actor is Actor {
  if (!can(actor, permission)) throw new ForbiddenError(permission);
}

/* ------------------------------------------------------------------ */
/* Droits de propriété (hors administration)                           */
/* ------------------------------------------------------------------ */

/** Un créateur ne gère que sa propre boutique. */
export function canManageShop(actor: Actor | Anonymous, shopOwnerUserId: ID): boolean {
  if (!actor || isBlocked(actor)) return false;
  if (actor.status === "restricted") return false;
  return actor.accountType === "creator" && actor.userId === shopOwnerUserId;
}

/** Un établissement professionnel ne gère que son propre catalogue. */
export function canManageBusiness(actor: Actor | Anonymous, businessOwnerUserId: ID): boolean {
  if (!actor || isBlocked(actor)) return false;
  if (actor.status === "restricted") return false;
  return actor.accountType === "business" && actor.userId === businessOwnerUserId;
}

/** Acheter exige un compte actif avec email vérifié. */
export function canPurchase(actor: Actor | Anonymous): boolean {
  if (!actor) return false;
  return actor.status === "active";
}

/* ------------------------------------------------------------------ */
/* Gestion des administrateurs                                         */
/* ------------------------------------------------------------------ */

export interface RoleChangeRequest {
  targetUserId: ID;
  currentRole: AdminRole | null;
  nextRole: AdminRole | null;
  /** Nombre de super admins actifs avant la modification. */
  activeSuperAdminCount: number;
}

export type RoleChangeDecision =
  | { allowed: true }
  | { allowed: false; reason: "forbidden" | "self_change" | "last_super_admin" };

/**
 * Seul un super admin peut attribuer ou retirer un rôle d'administration.
 * Il ne peut pas modifier son propre rôle, et la plateforme garde toujours
 * au moins un super admin actif.
 */
export function decideRoleChange(actor: Actor | Anonymous, request: RoleChangeRequest): RoleChangeDecision {
  if (!can(actor, "admins.manage")) return { allowed: false, reason: "forbidden" };
  if (actor!.userId === request.targetUserId) return { allowed: false, reason: "self_change" };
  const removesSuperAdmin = request.currentRole === "super_admin" && request.nextRole !== "super_admin";
  if (removesSuperAdmin && request.activeSuperAdminCount <= 1) {
    return { allowed: false, reason: "last_super_admin" };
  }
  return { allowed: true };
}
