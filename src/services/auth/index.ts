/**
 * Sélection du fournisseur d'authentification.
 *
 * SIGNE_AUTH_PROVIDER=memory   → local (défaut hors production).
 * SIGNE_AUTH_PROVIDER=supabase → prévu, nécessite le projet Supabase.
 *
 * En production, le fournisseur doit être choisi explicitement :
 * on ne démarre jamais par erreur sur un stockage en mémoire.
 */
import type { AuthProvider } from "./auth-provider";
import { createConsoleMailer } from "./mailer";
import { createMemoryAuthProvider, createMemoryAuthStore, type MemoryAuthStore } from "./memory/memory-auth";

const globalForAuth = globalThis as unknown as { __signeAuth?: AuthProvider; __signeAuthStore?: MemoryAuthStore };

export function getAuthProvider(): AuthProvider {
  if (globalForAuth.__signeAuth) return globalForAuth.__signeAuth;
  const configured = process.env.SIGNE_AUTH_PROVIDER;
  const source = configured ?? (process.env.NODE_ENV === "production" ? undefined : "memory");
  switch (source) {
    case "memory": {
      const store = (globalForAuth.__signeAuthStore ??= createMemoryAuthStore());
      globalForAuth.__signeAuth = createMemoryAuthProvider({
        store,
        mailer: createConsoleMailer(),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      });
      return globalForAuth.__signeAuth;
    }
    case "supabase":
      throw new Error("Le fournisseur Supabase n'est pas encore branché : projet et clés à fournir.");
    default:
      throw new Error("SIGNE_AUTH_PROVIDER doit être défini en production (memory ou supabase).");
  }
}
