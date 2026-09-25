import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { createRateLimiter } from "./rate-limit";
import { hashToken, generateToken } from "./tokens";
import { formToObject, resetPasswordSchema, safeNextPath, signUpSchema } from "./validation";

describe("validation de l'inscription", () => {
  const valid = { displayName: "Camille", email: "  Camille@Example.COM ", password: "motdepasse42" };

  it("accepte un formulaire valide et normalise l'e-mail", () => {
    const r = signUpSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.success && r.data.email).toBe("camille@example.com");
  });

  it("ignore tout champ de rôle envoyé par le navigateur", () => {
    const r = signUpSchema.safeParse({ ...valid, adminRole: "super_admin", accountType: "creator", status: "active" });
    expect(r.success).toBe(true);
    expect(r.success && Object.keys(r.data).sort()).toEqual(["displayName", "email", "password"]);
  });

  it("refuse un mot de passe trop court ou sans chiffre", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "court1" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "seulementdeslettres" }).success).toBe(false);
  });

  it("refuse une adresse invalide", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "pas-une-adresse" }).success).toBe(false);
  });

  it("vérifie la confirmation du nouveau mot de passe", () => {
    const token = generateToken();
    expect(resetPasswordSchema.safeParse({ token, password: "motdepasse42", confirm: "autre" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token, password: "motdepasse42", confirm: "motdepasse42" }).success).toBe(true);
  });

  it("lit un FormData", () => {
    const f = new FormData();
    f.set("email", "a@b.fr");
    expect(formToObject(f)).toEqual({ email: "a@b.fr" });
  });
});

describe("redirection après connexion", () => {
  it.each([
    ["/compte/favoris", "/compte/favoris"],
    ["/produits/x?y=1", "/produits/x?y=1"],
    ["https://evil.example", "/compte"],
    ["//evil.example", "/compte"],
    ["/\\evil.example", "/compte"],
    ["javascript:alert(1)", "/compte"],
    [undefined, "/compte"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("mots de passe", () => {
  it("vérifie le bon mot de passe et refuse le mauvais", async () => {
    const h = await hashPassword("motdepasse42");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("motdepasse42", h)).toBe(true);
    expect(await verifyPassword("motdepasse43", h)).toBe(false);
  });

  it("sale chaque empreinte différemment", async () => {
    expect(await hashPassword("identique1")).not.toBe(await hashPassword("identique1"));
  });

  it("refuse une empreinte mal formée", async () => {
    expect(await verifyPassword("x", "md5$abc")).toBe(false);
  });
});

describe("jetons", () => {
  it("génère des jetons uniques et une empreinte stable", () => {
    const a = generateToken();
    expect(a).not.toBe(generateToken());
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toContain(a);
  });
});

describe("limiteur de tentatives", () => {
  it("bloque au-delà de la limite puis rouvre après la fenêtre", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
    expect([1, 2, 3].map(() => rl.hit("k").allowed)).toEqual([true, true, true]);
    const blocked = rl.hit("k");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
    t = 1001;
    expect(rl.hit("k").allowed).toBe(true);
  });

  it("isole les clés", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    rl.hit("a");
    expect(rl.hit("b").allowed).toBe(true);
  });
});
