/**
 * Couche d'accès à la session, côté serveur uniquement.
 *
 * - Le cookie ne contient qu'un jeton opaque ; la session vit côté serveur.
 * - Chaque page protégée et chaque Server Action appellent ces fonctions :
 *   le proxy ne fait qu'un contrôle optimiste.
 * - Une page d'administration renvoie 404 à qui n'a pas la permission,
 *   pour ne pas révéler son existence.
 */
import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { type Actor, type AdminPermission, can } from "@/lib/auth/permissions";
import { safeNextPath } from "@/lib/auth/validation";
import type { AccountProfile } from "./auth-provider";
import { getAuthProvider } from "./index";

export const SESSION_COOKIE = "signe_session";

export async function setSessionCookie(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export interface CurrentUser {
  actor: Actor;
  profile: AccountProfile;
}

/** Utilisateur de la requête en cours, ou null. Mémoïsé pour la durée du rendu. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const auth = getAuthProvider();
  const session = await auth.getSession(token);
  if (!session) return null;
  const [actor, profile] = await Promise.all([auth.getActor(session), auth.getProfile(session.userId)]);
  if (!actor || !profile) return null;
  return { actor, profile };
});

/** Exige une session ; sinon redirige vers la connexion puis revient. */
export async function requireUser(nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  return user;
}

/** Exige une permission d'administration ; sinon 404. */
export async function requirePermission(permission: AdminPermission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !can(user.actor, permission)) notFound();
  return user;
}
