import { describe, expect, it } from "vitest";
import type { AdminRole } from "@/types/domain";
import {
  ADMIN_PERMISSIONS,
  type Actor,
  assertCan,
  can,
  canManageShop,
  canPurchase,
  decideRoleChange,
  ForbiddenError,
  ROLE_PERMISSIONS,
} from "./permissions";

const actor = (over: Partial<Actor> = {}): Actor => ({
  userId: "u1",
  accountType: "buyer",
  status: "active",
  adminRole: null,
  mfaVerified: true,
  ...over,
});

const admin = (role: AdminRole, over: Partial<Actor> = {}) => actor({ userId: `admin-${role}`, adminRole: role, ...over });

describe("utilisateurs non administrateurs", () => {
  it.each(ADMIN_PERMISSIONS)("un visiteur anonyme n'a jamais « %s »", (perm) => {
    expect(can(null, perm)).toBe(false);
  });

  it.each(["buyer", "creator", "business"] as const)("un compte %s n'a aucune permission d'administration", (accountType) => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(can(actor({ accountType }), perm)).toBe(false);
    }
  });

  it("assertCan lève ForbiddenError pour un utilisateur normal", () => {
    expect(() => assertCan(actor(), "admin.access")).toThrow(ForbiddenError);
  });
});

describe("rôles d'administration", () => {
  it("le super admin possède toutes les permissions", () => {
    for (const perm of ADMIN_PERMISSIONS) expect(can(admin("super_admin"), perm)).toBe(true);
  });

  it("chaque rôle n'a que ses permissions déclarées", () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as AdminRole[]) {
      for (const perm of ADMIN_PERMISSIONS) {
        expect(can(admin(role), perm)).toBe(ROLE_PERMISSIONS[role].includes(perm));
      }
    }
  });

  it("seul le super admin gère les administrateurs", () => {
    const managers = (Object.keys(ROLE_PERMISSIONS) as AdminRole[]).filter((r) => can(admin(r), "admins.manage"));
    expect(managers).toEqual(["super_admin"]);
  });

  it("la modération ne peut ni rembourser ni voir la finance", () => {
    expect(can(admin("moderator"), "refunds.issue")).toBe(false);
    expect(can(admin("moderator"), "finance.read")).toBe(false);
  });

  it("le support ne peut pas émettre de remboursement direct", () => {
    expect(can(admin("support"), "refunds.issue")).toBe(false);
  });

  it("l'analyste n'accède à aucune donnée nominative", () => {
    const a = admin("analyst");
    for (const perm of ["users.read", "users.read_contact", "orders.read", "tickets.read", "finance.read"] as const) {
      expect(can(a, perm)).toBe(false);
    }
    expect(can(a, "analytics.read")).toBe(true);
  });

  it("aucune permission sans double authentification validée", () => {
    expect(can(admin("super_admin", { mfaVerified: false }), "admin.access")).toBe(false);
  });

  it.each(["suspended", "banned"] as const)("un administrateur %s perd tout accès", (status) => {
    expect(can(admin("super_admin", { status }), "admin.access")).toBe(false);
  });
});

describe("changement de rôle", () => {
  const request = { targetUserId: "u2", currentRole: null, nextRole: "moderator" as const, activeSuperAdminCount: 2 };

  it("un utilisateur normal ne peut pas se donner un rôle admin", () => {
    expect(decideRoleChange(actor(), { ...request, targetUserId: "u1", nextRole: "super_admin" })).toEqual({
      allowed: false,
      reason: "forbidden",
    });
  });

  it("un modérateur ne peut pas promouvoir quelqu'un", () => {
    expect(decideRoleChange(admin("moderator"), request).allowed).toBe(false);
  });

  it("un super admin peut attribuer un rôle", () => {
    expect(decideRoleChange(admin("super_admin"), request)).toEqual({ allowed: true });
  });

  it("un super admin ne modifie pas son propre rôle", () => {
    const self = admin("super_admin");
    expect(decideRoleChange(self, { ...request, targetUserId: self.userId })).toEqual({ allowed: false, reason: "self_change" });
  });

  it("on ne retire pas le dernier super admin", () => {
    expect(
      decideRoleChange(admin("super_admin"), { targetUserId: "u2", currentRole: "super_admin", nextRole: null, activeSuperAdminCount: 1 }),
    ).toEqual({ allowed: false, reason: "last_super_admin" });
  });
});

describe("droits de propriété", () => {
  it("un créateur gère sa boutique, pas celle d'un autre", () => {
    const c = actor({ accountType: "creator", userId: "creator-1" });
    expect(canManageShop(c, "creator-1")).toBe(true);
    expect(canManageShop(c, "creator-2")).toBe(false);
  });

  it("un acheteur ne gère aucune boutique", () => {
    expect(canManageShop(actor({ userId: "x" }), "x")).toBe(false);
  });

  it("un créateur restreint ne peut plus modifier sa boutique", () => {
    expect(canManageShop(actor({ accountType: "creator", status: "restricted" }), "u1")).toBe(false);
  });

  it("acheter exige un compte actif", () => {
    expect(canPurchase(null)).toBe(false);
    expect(canPurchase(actor({ status: "pending_verification" }))).toBe(false);
    expect(canPurchase(actor())).toBe(true);
  });
});
