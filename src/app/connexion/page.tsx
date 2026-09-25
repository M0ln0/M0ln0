import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/account/auth-shell";
import { SignInForm } from "@/features/account/forms";
import { safeNextPath } from "@/lib/auth/validation";
import { getCurrentUser } from "@/services/auth/session";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);
  if (await getCurrentUser()) redirect(next);
  const flash = params.verifie ? "Adresse confirmée. Vous pouvez vous connecter." : params.reinitialise ? "Mot de passe modifié. Connectez-vous avec le nouveau." : null;
  return (
    <AuthShell
      eyebrow="Connexion"
      title="Bon retour."
      intro="Retrouvez vos pièces sauvegardées et les créateurs que vous suivez."
      aside={
        <p className="text-sm text-ink-2">
          Pas encore de compte ?{" "}
          <Link href={`/inscription${next !== "/compte" ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline underline-offset-4 hover:text-signature">
            Créer un compte
          </Link>
        </p>
      }
    >
      {flash && (
        <p role="status" className="mb-5 rounded-card bg-success/10 px-4 py-3 text-sm text-success">
          {flash}
        </p>
      )}
      <SignInForm next={next} />
      <p className="mt-6 border-t border-line pt-6 text-center text-sm lg:hidden">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="underline underline-offset-4">
          Créer un compte
        </Link>
      </p>
    </AuthShell>
  );
}
