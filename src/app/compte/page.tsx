import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/services/auth/session";
import { getCommunityRepository } from "@/services/community";
import { AccountNav } from "./account-nav";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function AccountPage() {
  const { profile, actor } = await requireUser("/compte");
  const community = getCommunityRepository();
  const [favorites, follows] = await Promise.all([community.listFavoriteProductIds(actor.userId), community.listFollowedCreatorIds(actor.userId)]);
  return (
    <Container className="py-10 sm:py-14">
      <p className="eyebrow">Mon compte</p>
      <h1 className="mb-8 mt-2 font-display text-headline">Bonjour {profile.displayName}.</h1>
      <AccountNav current="/compte" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="eyebrow mb-4">Profil</h2>
          <dl className="divide-y divide-line border-y border-line text-sm">
            {[
              ["Nom affiché", profile.displayName],
              ["Adresse e-mail", profile.email],
              ["Membre depuis", formatDate(profile.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3">
                <dt className="text-ink-3">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-ink-3">
            Pour changer de mot de passe,{" "}
            <Link href="/mot-de-passe-oublie" className="underline underline-offset-4 hover:text-ink">
              demandez un lien de réinitialisation
            </Link>
            .
          </p>
        </section>
        <section className="grid grid-cols-2 gap-px self-start bg-line">
          <Link href="/compte/favoris" className="group bg-paper p-6 hover:bg-paper-2">
            <span className="eyebrow">Favoris</span>
            <span className="mt-2 block font-display text-6xl group-hover:text-signature">{favorites.length}</span>
          </Link>
          <Link href="/compte/createurs-suivis" className="group bg-paper p-6 hover:bg-paper-2">
            <span className="eyebrow">Créateurs suivis</span>
            <span className="mt-2 block font-display text-6xl group-hover:text-signature">{follows.length}</span>
          </Link>
        </section>
      </div>
    </Container>
  );
}
