import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/account/auth-shell";
import { ResetPasswordForm } from "@/features/account/forms";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reinitialiser-mot-de-passe">) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  return (
    <AuthShell eyebrow="Nouveau mot de passe" title="Choisissez un nouveau mot de passe." intro="Toutes vos sessions ouvertes seront fermées par sécurité.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-ink-2">
          Ce lien est incomplet.{" "}
          <Link href="/mot-de-passe-oublie" className="underline underline-offset-4">
            Faites une nouvelle demande
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
