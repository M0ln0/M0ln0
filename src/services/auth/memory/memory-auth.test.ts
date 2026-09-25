import { beforeEach, describe, expect, it } from "vitest";
import { ADMIN_PERMISSIONS, can } from "@/lib/auth/permissions";
import { createMemoryMailer } from "../mailer";
import { createMemoryAuthProvider, createMemoryAuthStore, type MemoryAuthStore } from "./memory-auth";

let t = Date.parse("2026-09-25T10:00:00Z");
let store: MemoryAuthStore;
let mailer: ReturnType<typeof createMemoryMailer>;
let auth: ReturnType<typeof createMemoryAuthProvider>;

const tokenFrom = (i = mailer.outbox.length - 1) => new URL(mailer.outbox[i].link!).searchParams.get("token")!;

async function verifiedUser(email = "camille@example.com", password = "motdepasse42") {
  await auth.signUp({ email, password, displayName: "Camille" });
  await auth.verifyEmail(tokenFrom());
  const r = await auth.signIn(email, password);
  if (!r.ok) throw new Error(r.error);
  const session = (await auth.getSession(r.sessionToken))!;
  return { token: r.sessionToken, session };
}

beforeEach(() => {
  t = Date.parse("2026-09-25T10:00:00Z");
  store = createMemoryAuthStore();
  mailer = createMemoryMailer();
  auth = createMemoryAuthProvider({ store, mailer, siteUrl: "https://signe.test", now: () => t });
});

describe("inscription et vérification", () => {
  it("crée un compte acheteur en attente et envoie un lien de vérification", async () => {
    await auth.signUp({ email: "Camille@Example.com", password: "motdepasse42", displayName: " Camille " });
    const [user] = store.users.values();
    expect(user).toMatchObject({ email: "camille@example.com", displayName: "Camille", accountType: "buyer", status: "pending_verification" });
    expect(user.passwordHash).not.toContain("motdepasse42");
    expect(mailer.outbox[0].link).toMatch(/^https:\/\/signe\.test\/verifier-email\?token=/);
  });

  it("refuse la connexion avant vérification, l'accepte après", async () => {
    await auth.signUp({ email: "a@b.fr", password: "motdepasse42", displayName: "A" });
    expect(await auth.signIn("a@b.fr", "motdepasse42")).toEqual({ ok: false, error: "email_not_verified" });
    expect((await auth.verifyEmail(tokenFrom())).ok).toBe(true);
    expect((await auth.signIn("a@b.fr", "motdepasse42")).ok).toBe(true);
  });

  it("n'accepte un jeton de vérification qu'une fois", async () => {
    await auth.signUp({ email: "a@b.fr", password: "motdepasse42", displayName: "A" });
    const token = tokenFrom();
    expect((await auth.verifyEmail(token)).ok).toBe(true);
    expect(await auth.verifyEmail(token)).toEqual({ ok: false, error: "invalid_token" });
  });

  it("refuse un jeton de vérification expiré", async () => {
    await auth.signUp({ email: "a@b.fr", password: "motdepasse42", displayName: "A" });
    t += 25 * 3_600_000;
    expect((await auth.verifyEmail(tokenFrom())).ok).toBe(false);
  });

  it("ne révèle pas qu'une adresse existe déjà", async () => {
    await auth.signUp({ email: "a@b.fr", password: "motdepasse42", displayName: "A" });
    await expect(auth.signUp({ email: "A@B.FR", password: "autremotdepasse9", displayName: "Intrus" })).resolves.toBeUndefined();
    expect(store.users.size).toBe(1);
    expect(mailer.outbox[1].subject).toBe("Vous avez déjà un compte Signé");
  });

  it("ne conserve jamais le jeton en clair", async () => {
    await auth.signUp({ email: "a@b.fr", password: "motdepasse42", displayName: "A" });
    expect([...store.verificationTokens.keys()]).not.toContain(tokenFrom());
  });
});

describe("connexion et session", () => {
  it("donne la même erreur pour une adresse inconnue et un mauvais mot de passe", async () => {
    await verifiedUser();
    expect(await auth.signIn("inconnu@example.com", "motdepasse42")).toEqual({ ok: false, error: "invalid_credentials" });
    expect(await auth.signIn("camille@example.com", "mauvais-mot-2")).toEqual({ ok: false, error: "invalid_credentials" });
  });

  it("résout la session et la supprime à la déconnexion", async () => {
    const { token } = await verifiedUser();
    expect(await auth.getSession(token)).not.toBeNull();
    await auth.signOut(token);
    expect(await auth.getSession(token)).toBeNull();
  });

  it("expire la session", async () => {
    const { token } = await verifiedUser();
    t += 31 * 86_400_000;
    expect(await auth.getSession(token)).toBeNull();
  });

  it("coupe les sessions d'un compte suspendu et refuse sa connexion", async () => {
    const { token, session } = await verifiedUser();
    store.users.get(session.userId)!.status = "suspended";
    expect(await auth.getSession(token)).toBeNull();
    expect(await auth.signIn("camille@example.com", "motdepasse42")).toEqual({ ok: false, error: "account_blocked" });
  });

  it("refuse un jeton de session inventé", async () => {
    await verifiedUser();
    expect(await auth.getSession("jeton-invente")).toBeNull();
  });
});

describe("réinitialisation du mot de passe", () => {
  it("change le mot de passe et révoque toutes les sessions", async () => {
    const { token } = await verifiedUser();
    await auth.requestPasswordReset("camille@example.com");
    expect((await auth.resetPassword(tokenFrom(), "nouveaumotdepasse7")).ok).toBe(true);
    expect(await auth.getSession(token)).toBeNull();
    expect((await auth.signIn("camille@example.com", "motdepasse42")).ok).toBe(false);
    expect((await auth.signIn("camille@example.com", "nouveaumotdepasse7")).ok).toBe(true);
  });

  it("n'envoie rien pour une adresse inconnue", async () => {
    await auth.requestPasswordReset("personne@example.com");
    expect(mailer.outbox).toHaveLength(0);
  });

  it("refuse un lien expiré ou déjà utilisé", async () => {
    await verifiedUser();
    await auth.requestPasswordReset("camille@example.com");
    const token = tokenFrom();
    t += 2 * 3_600_000;
    expect((await auth.resetPassword(token, "nouveaumotdepasse7")).ok).toBe(false);
    expect((await auth.resetPassword(token, "nouveaumotdepasse7")).ok).toBe(false);
  });
});

describe("administration : aucun accès depuis un compte normal", () => {
  it("un acheteur connecté n'a aucune permission d'administration", async () => {
    const { session } = await verifiedUser();
    const actor = (await auth.getActor(session))!;
    expect(actor.adminRole).toBeNull();
    for (const p of ADMIN_PERMISSIONS) expect(can(actor, p)).toBe(false);
  });

  it("un rôle admin attribué côté serveur reste inactif sans double authentification", async () => {
    const { session } = await verifiedUser();
    store.adminMembers.set(session.userId, { role: "super_admin", active: true });
    const actor = (await auth.getActor(session))!;
    expect(actor.adminRole).toBe("super_admin");
    expect(can(actor, "admin.access")).toBe(false);
  });

  it("un rôle admin désactivé n'est pas pris en compte", async () => {
    const { session } = await verifiedUser();
    store.adminMembers.set(session.userId, { role: "support", active: false });
    expect((await auth.getActor(session))!.adminRole).toBeNull();
  });
});
