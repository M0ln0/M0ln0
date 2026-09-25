/**
 * Contrat du fournisseur d'authentification.
 *
 * Implémentations :
 * - `memory` : local, pour le développement et les tests. Données perdues au redémarrage.
 * - `supabase` : prévue, branchée dès que le projet Supabase et ses clés existent.
 *
 * Règles communes :
 * - l'inscription crée toujours un compte acheteur, jamais un rôle admin ;
 * - les réponses ne révèlent pas si une adresse est déjà inscrite ;
 * - les rôles admin sont lus côté serveur, jamais depuis le navigateur.
 */
import type { Actor } from "@/lib/auth/permissions";
import type { AccountStatus, AccountType, ID, ISODate } from "@/types/domain";

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

export type SignInResult =
  | { ok: true; sessionToken: string; expiresAt: ISODate }
  | { ok: false; error: "invalid_credentials" | "email_not_verified" | "account_blocked" };

export type TokenResult = { ok: true; userId: ID } | { ok: false; error: "invalid_token" };

export interface SessionRecord {
  userId: ID;
  expiresAt: ISODate;
  /** Date de validation de la double authentification pour cette session. */
  mfaVerifiedAt: ISODate | null;
}

/** Profil exposé à l'application : aucune donnée d'authentification. */
export interface AccountProfile {
  id: ID;
  email: string;
  displayName: string;
  accountType: AccountType;
  status: AccountStatus;
  createdAt: ISODate;
}

export interface AuthProvider {
  readonly name: string;
  signUp(input: SignUpInput): Promise<void>;
  resendVerification(email: string): Promise<void>;
  verifyEmail(token: string): Promise<TokenResult>;
  signIn(email: string, password: string): Promise<SignInResult>;
  getSession(sessionToken: string): Promise<SessionRecord | null>;
  signOut(sessionToken: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  /** Change le mot de passe et révoque toutes les sessions du compte. */
  resetPassword(token: string, newPassword: string): Promise<TokenResult>;
  getProfile(userId: ID): Promise<AccountProfile | null>;
  /** Identité complète pour les contrôles de permission, résolue côté serveur. */
  getActor(session: SessionRecord): Promise<Actor | null>;
}
