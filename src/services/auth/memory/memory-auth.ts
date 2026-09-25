/**
 * Fournisseur d'authentification local.
 *
 * Fonctionnel de bout en bout (mots de passe hachés, jetons à usage unique,
 * sessions révocables), mais stocké en mémoire : réservé au développement
 * et aux tests. Refusé en production sauf activation explicite.
 */
import type { Actor } from "@/lib/auth/permissions";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import type { AccountStatus, AccountType, AdminRole, ID } from "@/types/domain";
import type { AccountProfile, AuthProvider, SessionRecord, SignInResult, SignUpInput, TokenResult } from "../auth-provider";
import type { Mailer } from "../mailer";

interface StoredUser {
  id: ID;
  email: string;
  passwordHash: string;
  displayName: string;
  accountType: AccountType;
  status: AccountStatus;
  createdAt: string;
}

interface StoredToken {
  userId: ID;
  expiresAt: number;
}

export interface MemoryAuthStore {
  users: Map<ID, StoredUser>;
  byEmail: Map<string, ID>;
  sessions: Map<string, SessionRecord>;
  verificationTokens: Map<string, StoredToken>;
  resetTokens: Map<string, StoredToken>;
  adminMembers: Map<ID, { role: AdminRole; active: boolean }>;
}

export function createMemoryAuthStore(): MemoryAuthStore {
  return {
    users: new Map(),
    byEmail: new Map(),
    sessions: new Map(),
    verificationTokens: new Map(),
    resetTokens: new Map(),
    adminMembers: new Map(),
  };
}

export interface MemoryAuthOptions {
  store: MemoryAuthStore;
  mailer: Mailer;
  siteUrl: string;
  now?: () => number;
  sessionTtlMs?: number;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function createMemoryAuthProvider({ store, mailer, siteUrl, now = () => Date.now(), sessionTtlMs = 30 * DAY }: MemoryAuthOptions): AuthProvider {
  // Empreinte factice : même coût de calcul quand l'adresse n'existe pas.
  const dummyHash = hashPassword("mot-de-passe-factice-0");

  const link = (path: string, token: string) => `${siteUrl.replace(/\/$/, "")}${path}?token=${encodeURIComponent(token)}`;
  const findByEmail = (email: string) => {
    const id = store.byEmail.get(email.trim().toLowerCase());
    return id ? store.users.get(id) : undefined;
  };

  async function sendVerification(user: StoredUser) {
    const token = generateToken();
    store.verificationTokens.set(hashToken(token), { userId: user.id, expiresAt: now() + DAY });
    await mailer.send({
      to: user.email,
      subject: "Confirmez votre adresse e-mail",
      text: `Bonjour ${user.displayName}, confirmez votre adresse pour activer votre compte Signé. Le lien est valable 24 heures.`,
      link: link("/verifier-email", token),
    });
  }

  function consume(map: Map<string, StoredToken>, token: string): TokenResult {
    const key = hashToken(token);
    const entry = map.get(key);
    map.delete(key); // usage unique, même s'il a expiré
    if (!entry || entry.expiresAt <= now() || !store.users.has(entry.userId)) return { ok: false, error: "invalid_token" };
    return { ok: true, userId: entry.userId };
  }

  return {
    name: "memory",

    async signUp({ email, password, displayName }: SignUpInput) {
      const normalized = email.trim().toLowerCase();
      const existing = findByEmail(normalized);
      if (existing) {
        await mailer.send({
          to: existing.email,
          subject: "Vous avez déjà un compte Signé",
          text: "Quelqu'un a tenté de créer un compte avec votre adresse. Si c'était vous, connectez-vous ou réinitialisez votre mot de passe.",
          link: `${siteUrl.replace(/\/$/, "")}/connexion`,
        });
        return;
      }
      const user: StoredUser = {
        id: crypto.randomUUID(),
        email: normalized,
        passwordHash: await hashPassword(password),
        displayName: displayName.trim(),
        accountType: "buyer",
        status: "pending_verification",
        createdAt: new Date(now()).toISOString(),
      };
      store.users.set(user.id, user);
      store.byEmail.set(normalized, user.id);
      await sendVerification(user);
    },

    async resendVerification(email) {
      const user = findByEmail(email);
      if (user && user.status === "pending_verification") await sendVerification(user);
    },

    async verifyEmail(token) {
      const r = consume(store.verificationTokens, token);
      if (r.ok) {
        const user = store.users.get(r.userId)!;
        if (user.status === "pending_verification") user.status = "active";
      }
      return r;
    },

    async signIn(email, password): Promise<SignInResult> {
      const user = findByEmail(email);
      const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
      if (!user || !ok) return { ok: false, error: "invalid_credentials" };
      if (user.status === "pending_verification") return { ok: false, error: "email_not_verified" };
      if (user.status === "suspended" || user.status === "banned") return { ok: false, error: "account_blocked" };
      const token = generateToken();
      const expiresAt = new Date(now() + sessionTtlMs).toISOString();
      store.sessions.set(hashToken(token), { userId: user.id, expiresAt, mfaVerifiedAt: null });
      return { ok: true, sessionToken: token, expiresAt };
    },

    async getSession(token) {
      const key = hashToken(token);
      const s = store.sessions.get(key);
      if (!s) return null;
      if (Date.parse(s.expiresAt) <= now()) {
        store.sessions.delete(key);
        return null;
      }
      const user = store.users.get(s.userId);
      if (!user || user.status === "suspended" || user.status === "banned") return null;
      return s;
    },

    async signOut(token) {
      store.sessions.delete(hashToken(token));
    },

    async requestPasswordReset(email) {
      const user = findByEmail(email);
      if (!user) return;
      const token = generateToken();
      store.resetTokens.set(hashToken(token), { userId: user.id, expiresAt: now() + HOUR });
      await mailer.send({
        to: user.email,
        subject: "Réinitialiser votre mot de passe",
        text: "Utilisez ce lien pour choisir un nouveau mot de passe. Il est valable une heure. Si vous n'êtes pas à l'origine de la demande, ignorez ce message.",
        link: link("/reinitialiser-mot-de-passe", token),
      });
    },

    async resetPassword(token, newPassword) {
      const r = consume(store.resetTokens, token);
      if (!r.ok) return r;
      const user = store.users.get(r.userId)!;
      user.passwordHash = await hashPassword(newPassword);
      // Recevoir le lien prouve la possession de l'adresse.
      if (user.status === "pending_verification") user.status = "active";
      for (const [key, s] of store.sessions) if (s.userId === user.id) store.sessions.delete(key);
      for (const [key, t] of store.resetTokens) if (t.userId === user.id) store.resetTokens.delete(key);
      return r;
    },

    async getProfile(userId): Promise<AccountProfile | null> {
      const u = store.users.get(userId);
      if (!u) return null;
      return { id: u.id, email: u.email, displayName: u.displayName, accountType: u.accountType, status: u.status, createdAt: u.createdAt };
    },

    async getActor(session): Promise<Actor | null> {
      const u = store.users.get(session.userId);
      if (!u) return null;
      const admin = store.adminMembers.get(u.id);
      return {
        userId: u.id,
        accountType: u.accountType,
        status: u.status,
        adminRole: admin?.active ? admin.role : null,
        mfaVerified: session.mfaVerifiedAt !== null,
      };
    },
  };
}
