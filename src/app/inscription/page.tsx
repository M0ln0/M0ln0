import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/account/auth-shell";
import { SignUpForm } from "@/features/account/forms";
import { getCurrentUser } from "@/services/auth/session";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/compte");
  return (
    <AuthShell
      eyebrow="Créer un compte"
      title={
        <>
          Suivez les créateurs <em className="text-signature">avant</em> tout le monde.
        </>
      }
      intro="Sauvegardez vos pièces préférées et retrouvez les nouveautés des créateurs que vous suivez."
      aside={
        <div className="space-y-4 text-sm text-ink-2">
          <p>
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="underline underline-offset-4 hover:text-signature">
              Se connecter
            </Link>
          </p>
          <p>
            Vous êtes créateur ? Créez d&apos;abord votre compte : la candidature pour ouvrir votre boutique se fait ensuite, voir{" "}
            <Link href="/devenir-createur" className="underline underline-offset-4 hover:text-signature">
              Devenir créateur
            </Link>
            .
          </p>
        </div>
      }
    >
      <SignUpForm />
      <p className="mt-6 border-t border-line pt-6 text-center text-sm lg:hidden">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
