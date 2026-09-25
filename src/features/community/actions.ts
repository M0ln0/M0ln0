"use server";

/**
 * Favoris et suivis. L'utilisateur est toujours résolu côté serveur ;
 * l'identifiant de la cible est vérifié contre le catalogue public.
 */
import { z } from "zod";
import { isPublicCreator, isPublicProduct } from "@/services/catalog";
import { getCurrentUser } from "@/services/auth/session";
import { getCommunityRepository } from "@/services/community";

export type ToggleResult = { ok: true; on: boolean } | { ok: false; reason: "auth" | "invalid" };

const input = z.object({ id: z.string().min(1).max(120), on: z.boolean() });

export async function setFavoriteAction(id: string, on: boolean): Promise<ToggleResult> {
  const parsed = input.safeParse({ id, on });
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  if (!(await isPublicProduct(parsed.data.id))) return { ok: false, reason: "invalid" };
  await getCommunityRepository().setFavorite(user.actor.userId, parsed.data.id, parsed.data.on);
  return { ok: true, on: parsed.data.on };
}

export async function setFollowAction(id: string, on: boolean): Promise<ToggleResult> {
  const parsed = input.safeParse({ id, on });
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  if (!(await isPublicCreator(parsed.data.id))) return { ok: false, reason: "invalid" };
  await getCommunityRepository().setFollow(user.actor.userId, parsed.data.id, parsed.data.on);
  return { ok: true, on: parsed.data.on };
}
