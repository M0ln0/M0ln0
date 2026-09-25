import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/permissions";
import { requirePermission } from "@/services/auth/session";

export const metadata: Metadata = { title: "Centre de contrôle", robots: { index: false, follow: false } };

/**
 * Point d'entrée de l'administration. Toute personne sans la permission
 * admin.access (rôle attribué côté serveur + double authentification) reçoit
 * une page 404 : l'existence de cette page n'est pas révélée.
 * Le contenu du centre de contrôle arrive au Sprint 7.
 */
export default async function AdminPage() {
  const { actor, profile } = await requirePermission("admin.access");
  return (
    <Container className="py-14">
      <p className="eyebrow">Administration · {actor.adminRole ? ADMIN_ROLE_LABELS[actor.adminRole] : ""}</p>
      <h1 className="mt-2 font-display text-headline">Centre de contrôle</h1>
      <p className="mt-4 text-ink-2">Connecté en tant que {profile.displayName}.</p>
    </Container>
  );
}
