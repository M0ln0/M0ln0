import { type CommunityRepository, createMemoryCommunityRepository } from "./community-repository";

const g = globalThis as unknown as { __signeCommunity?: CommunityRepository };

export function getCommunityRepository(): CommunityRepository {
  // Même règle que l'authentification : pas de stockage mémoire en production par défaut.
  const source = process.env.SIGNE_AUTH_PROVIDER ?? (process.env.NODE_ENV === "production" ? undefined : "memory");
  if (source !== "memory") throw new Error("Favoris et suivis : seule l'implémentation mémoire existe pour l'instant.");
  return (g.__signeCommunity ??= createMemoryCommunityRepository());
}
