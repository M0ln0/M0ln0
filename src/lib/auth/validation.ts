/**
 * Validation des formulaires d'authentification.
 *
 * Aucun champ de rôle n'est accepté : l'inscription crée toujours un compte
 * acheteur. Le compte créateur passe par une candidature (Sprint 3) et les
 * rôles d'administration ne s'attribuent que côté serveur.
 *
 * L'acceptation des CGU sera ajoutée avec les pages légales : aucune
 * condition d'utilisation n'est rédigée à ce jour.
 */
import { z } from "zod";

export const PASSWORD_MIN = 10;

const email = z
  .string({ error: "Adresse e-mail requise." })
  .trim()
  .toLowerCase()
  .max(254, "Adresse e-mail trop longue.")
  .pipe(z.email({ error: "Adresse e-mail invalide." }));

const password = z
  .string({ error: "Mot de passe requis." })
  .min(PASSWORD_MIN, `Au moins ${PASSWORD_MIN} caractères.`)
  .max(128, "128 caractères au maximum.")
  .refine((p) => /[A-Za-zÀ-ÿ]/.test(p) && /[0-9]/.test(p), "Au moins une lettre et un chiffre.");

export const signUpSchema = z
  .object({
    displayName: z
      .string({ error: "Nom requis." })
      .trim()
      .min(1, "Nom requis.")
      .max(80, "80 caractères au maximum."),
    email,
    password,
  })
  .strip();

export const signInSchema = z
  .object({
    email,
    password: z.string({ error: "Mot de passe requis." }).min(1, "Mot de passe requis.").max(128),
  })
  .strip();

export const resetRequestSchema = z.object({ email }).strip();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password,
    confirm: z.string(),
  })
  .strip()
  .refine((v) => v.password === v.confirm, { message: "Les mots de passe ne correspondent pas.", path: ["confirm"] });

export type FieldErrors = Partial<Record<string, string[]>>;

/** Lit un FormData en objet simple (une valeur par clé). */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/**
 * Protège contre les redirections ouvertes : seul un chemin interne
 * (commençant par un seul « / ») est accepté.
 */
export function safeNextPath(value: unknown, fallback = "/compte"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(value) || value.length > 300) return fallback;
  try {
    const url = new URL(value, "http://signe.local");
    if (url.origin !== "http://signe.local") return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
