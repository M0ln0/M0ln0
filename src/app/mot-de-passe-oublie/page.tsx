import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/account/auth-shell";
import { ResetRequestForm } from "@/features/account/forms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Mot de passe oublié"
      title="Ça arrive."
      intro="Indiquez votre adresse : nous vous envoyons un lien pour choisir un nouveau mot de passe."
      aside={
        <Link href="/connexion" className="text-sm underline underline-offset-4 hover:text-signature">
          Retour à la connexion
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
