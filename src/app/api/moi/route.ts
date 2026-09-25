/**
 * État personnel minimal pour l'interface : nom affiché, favoris, suivis.
 * Les pages du catalogue restent statiques ; ce point d'accès complète
 * l'affichage côté navigateur. Aucune donnée sensible n'est renvoyée.
 */
import { getCurrentUser } from "@/services/auth/session";
import { getCommunityRepository } from "@/services/community";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user) return Response.json({ user: null, favorites: [], follows: [] }, { headers });
  const community = getCommunityRepository();
  const [favorites, follows] = await Promise.all([
    community.listFavoriteProductIds(user.actor.userId),
    community.listFollowedCreatorIds(user.actor.userId),
  ]);
  return Response.json({ user: { displayName: user.profile.displayName }, favorites, follows }, { headers });
}
