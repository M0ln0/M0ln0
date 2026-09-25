import type { Metadata } from "next";
import { ButtonLink, Container, EmptyState, SectionHeader } from "@/components/ui/primitives";
import { CreatorCard } from "@/features/creators/creator-card";
import { ProductGrid } from "@/features/marketplace/product-card";
import { requireUser } from "@/services/auth/session";
import { getCreatorCards, getNewArrivalsFrom } from "@/services/catalog";
import { getCommunityRepository } from "@/services/community";
import { AccountNav } from "../account-nav";

export const metadata: Metadata = { title: "Créateurs suivis", robots: { index: false } };

export default async function FollowedCreatorsPage() {
  const { actor } = await requireUser("/compte/createurs-suivis");
  const ids = await getCommunityRepository().listFollowedCreatorIds(actor.userId);
  const [creators, arrivals] = await Promise.all([getCreatorCards(ids), getNewArrivalsFrom(ids, 8)]);
  return (
    <Container className="py-10 sm:py-14">
      <p className="eyebrow">Mon compte</p>
      <h1 className="mb-8 mt-2 font-display text-headline">Créateurs suivis</h1>
      <AccountNav current="/compte/createurs-suivis" />
      {creators.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Vous ne suivez personne pour l'instant." action={<ButtonLink href="/createurs">Découvrir les créateurs</ButtonLink>}>
            Suivez un créateur pour retrouver ici ses nouvelles pièces.
          </EmptyState>
        </div>
      ) : (
        <>
          <section className="mt-10">
            <SectionHeader eyebrow="Nouveautés" title="Les dernières pièces de vos créateurs" />
            <ProductGrid items={arrivals} />
          </section>
          <section className="mt-16 border-t border-line pt-12">
            <SectionHeader eyebrow={`${creators.length} ${creators.length > 1 ? "créateurs" : "créateur"}`} title="Vous les suivez" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {creators.map((c) => (
                <CreatorCard key={c.creator.id} data={c} />
              ))}
            </div>
          </section>
        </>
      )}
    </Container>
  );
}
