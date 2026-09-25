import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/account/auth-shell";
import { VerifyEmailForm } from "@/features/account/forms";

export const metadata: Metadata = { title: "Confirmer votre adresse", robots: { index: false } };

/**
 * La confirmation passe par un bouton et non par la simple ouverture du lien :
 * les logiciels qui prévisualisent les e-mails ne consomment pas le jeton.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verifier-email">) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  return (
    <AuthShell eyebrow="Confirmation" title="Confirmez votre adresse." intro="Un dernier clic pour activer votre compte Signé.">
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <p className="text-sm text-ink-2">
          Ce lien est incomplet. Ouvrez à nouveau le lien reçu par e-mail, ou{" "}
          <Link href="/connexion" className="underline underline-offset-4">
            demandez-en un nouveau
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
