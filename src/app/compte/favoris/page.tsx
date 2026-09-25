import type { Metadata } from "next";
import { ButtonLink, Container, EmptyState } from "@/components/ui/primitives";
import { ProductGrid } from "@/features/marketplace/product-card";
import { requireUser } from "@/services/auth/session";
import { getProductCards } from "@/services/catalog";
import { getCommunityRepository } from "@/services/community";
import { AccountNav } from "../account-nav";

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } };

export default async function FavoritesPage() {
  const { actor } = await requireUser("/compte/favoris");
  const ids = await getCommunityRepository().listFavoriteProductIds(actor.userId);
  const items = await getProductCards(ids);
  return (
    <Container className="py-10 sm:py-14">
      <p className="eyebrow">Mon compte</p>
      <h1 className="mb-8 mt-2 font-display text-headline">Mes favoris</h1>
      <AccountNav current="/compte/favoris" />
      <div className="mt-10">
        {items.length ? (
          <ProductGrid items={items} />
        ) : (
          <EmptyState title="Aucune pièce sauvegardée." action={<ButtonLink href="/explorer">Explorer les pièces</ButtonLink>}>
            Touchez le cœur sur une pièce pour la retrouver ici.
          </EmptyState>
        )}
      </div>
    </Container>
  );
}
