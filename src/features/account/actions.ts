"use server";

/**
 * Actions d'authentification. Chaque action valide ses entrées côté serveur,
 * limite les tentatives et ne révèle jamais si une adresse est inscrite.
 */
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createRateLimiter, type RateLimiter } from "@/lib/auth/rate-limit";
import {
  type FieldErrors,
  formToObject,
  resetPasswordSchema,
  resetRequestSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/validation";
import { getAuthProvider } from "@/services/auth";
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie } from "@/services/auth/session";

export interface FormState {
  errors?: FieldErrors;
  message?: string;
  done?: boolean;
  values?: Record<string, string>;
}

const MIN15 = 15 * 60_000;
const g = globalThis as unknown as { __signeLimiters?: Record<string, RateLimiter> };
const limiters = (g.__signeLimiters ??= {
  signInEmail: createRateLimiter({ limit: 5, windowMs: MIN15 }),
  signInIp: createRateLimiter({ limit: 30, windowMs: MIN15 }),
  signUpIp: createRateLimiter({ limit: 10, windowMs: 60 * 60_000 }),
  resetEmail: createRateLimiter({ limit: 3, windowMs: 60 * 60_000 }),
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
}

const TOO_MANY = (s: number) => `Trop de tentatives. Réessayez dans ${Math.max(1, Math.ceil(s / 60))} minute${s > 60 ? "s" : ""}.`;

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = formToObject(form);
  const parsed = signUpSchema.safeParse(raw);
  const values = { displayName: raw.displayName ?? "", email: raw.email ?? "" };
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const ip = limiters.signUpIp.hit(await clientIp());
  if (!ip.allowed) return { message: TOO_MANY(ip.retryAfterSeconds), values };
  await getAuthProvider().signUp(parsed.data);
  return { done: true, values: { email: parsed.data.email } };
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = formToObject(form);
  const values = { email: raw.email ?? "" };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const byIp = limiters.signInIp.hit(await clientIp());
  const byEmail = limiters.signInEmail.hit(parsed.data.email);
  if (!byIp.allowed || !byEmail.allowed) return { message: TOO_MANY(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds)), values };

  const result = await getAuthProvider().signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    const message = {
      invalid_credentials: "Adresse e-mail ou mot de passe incorrect.",
      email_not_verified: "Confirmez d'abord votre adresse e-mail : le lien vous a été envoyé à l'inscription.",
      account_blocked: "Ce compte est suspendu. Contactez le support.",
    }[result.error];
    return { message, values: { ...values, unverified: result.error === "email_not_verified" ? "1" : "" } };
  }
  limiters.signInEmail.reset(parsed.data.email);
  await setSessionCookie(result.sessionToken, result.expiresAt);
  redirect(safeNextPath(raw.next));
}

export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getAuthProvider().signOut(token);
  await clearSessionCookie();
  redirect("/");
}

export async function resendVerificationAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(formToObject(form));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const hit = limiters.resetEmail.hit(`verify:${parsed.data.email}`);
  if (hit.allowed) await getAuthProvider().resendVerification(parsed.data.email);
  return { done: true, message: "Si un compte en attente existe pour cette adresse, un nouveau lien vient d'être envoyé." };
}

export async function verifyEmailAction(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  if (token.length < 20 || token.length > 200) return { message: "Ce lien n'est pas valide." };
  const r = await getAuthProvider().verifyEmail(token);
  if (!r.ok) return { message: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau depuis la page de connexion." };
  redirect("/connexion?verifie=1");
}

export async function requestResetAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = formToObject(form);
  const parsed = resetRequestSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: { email: raw.email ?? "" } };
  const hit = limiters.resetEmail.hit(parsed.data.email);
  if (hit.allowed) await getAuthProvider().requestPasswordReset(parsed.data.email);
  return { done: true, message: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé. Il est valable une heure." };
}

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(formToObject(form));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const r = await getAuthProvider().resetPassword(parsed.data.token, parsed.data.password);
  if (!r.ok) return { message: "Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande." };
  redirect("/connexion?reinitialise=1");
}
