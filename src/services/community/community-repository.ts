/**
 * Favoris et suivis de créateurs.
 *
 * Implémentations : `memory` (aujourd'hui) et `postgres` (tables favorites
 * et creator_follows, déjà dans le schéma) quand Supabase sera branché.
 * Toutes les méthodes prennent l'identifiant de l'utilisateur authentifié,
 * résolu côté serveur : jamais un identifiant envoyé par le navigateur.
 */
import type { ID } from "@/types/domain";

export interface CommunityRepository {
  listFavoriteProductIds(userId: ID): Promise<ID[]>;
  setFavorite(userId: ID, productId: ID, on: boolean): Promise<void>;
  listFollowedCreatorIds(userId: ID): Promise<ID[]>;
  setFollow(userId: ID, creatorId: ID, on: boolean): Promise<void>;
  /** Nombre d'abonnés enregistrés sur Signé pour ce créateur. */
  countFollowers(creatorId: ID): Promise<number>;
}

export function createMemoryCommunityRepository(): CommunityRepository {
  // Ordre d'insertion conservé : les plus récents en premier à la lecture.
  const favorites = new Map<ID, Set<ID>>();
  const follows = new Map<ID, Set<ID>>();
  const bucket = (m: Map<ID, Set<ID>>, k: ID) => {
    let s = m.get(k);
    if (!s) m.set(k, (s = new Set()));
    return s;
  };
  const toggle = (s: Set<ID>, id: ID, on: boolean) => {
    s.delete(id);
    if (on) s.add(id);
  };
  return {
    async listFavoriteProductIds(userId) {
      return [...(favorites.get(userId) ?? [])].reverse();
    },
    async setFavorite(userId, productId, on) {
      toggle(bucket(favorites, userId), productId, on);
    },
    async listFollowedCreatorIds(userId) {
      return [...(follows.get(userId) ?? [])].reverse();
    },
    async setFollow(userId, creatorId, on) {
      toggle(bucket(follows, userId), creatorId, on);
    },
    async countFollowers(creatorId) {
      let n = 0;
      for (const s of follows.values()) if (s.has(creatorId)) n += 1;
      return n;
    },
  };
}
