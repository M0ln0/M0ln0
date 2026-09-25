"use client";

import Link from "next/link";
import { useActionState, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PASSWORD_MIN } from "@/lib/auth/validation";
import {
  type FormState,
  requestResetAction,
  resendVerificationAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
  verifyEmailAction,
} from "./actions";

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  errors,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  errors?: string[];
  hint?: string;
}) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={!!errors?.length}
        aria-describedby={errors?.length ? errId : undefined}
        className={cn("h-12 w-full rounded-card border bg-paper px-4 outline-none focus:border-ink", errors?.length ? "border-signature" : "border-line")}
      />
      {hint && !errors?.length && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
      {!!errors?.length && (
        <p id={errId} className="mt-1 text-sm text-signature">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

function Submit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={pending} className="h-12 w-full rounded-full bg-ink text-sm font-medium text-paper hover:bg-ink-2 disabled:opacity-60">
      {pending ? "Un instant…" : children}
    </button>
  );
}

function Notice({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cn("rounded-card px-4 py-3 text-sm", tone === "error" ? "bg-signature/10 text-signature-dark" : "bg-success/10 text-success")}>
      {children}
    </p>
  );
}

const initial: FormState = {};

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        {state.message && <Notice>{state.message}</Notice>}
        <Field name="email" label="Adresse e-mail" type="email" autoComplete="email" defaultValue={state.values?.email} errors={state.errors?.email} />
        <Field name="password" label="Mot de passe" type="password" autoComplete="current-password" errors={state.errors?.password} />
        <Submit pending={pending}>Se connecter</Submit>
      </form>
      {state.values?.unverified === "1" && <ResendVerificationForm email={state.values.email} />}
      <p className="text-center text-sm">
        <Link href="/mot-de-passe-oublie" className="underline underline-offset-4 hover:text-signature">
          Mot de passe oublié ?
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  if (state.done)
    return (
      <div className="space-y-4">
        <Notice tone="success">Vérifiez votre boîte mail : un lien de confirmation vient d&apos;être envoyé à {state.values?.email}. Il est valable 24 heures.</Notice>
        <p className="text-sm text-ink-2">Pas reçu ? Vérifiez vos courriers indésirables, ou demandez un nouveau lien depuis la page de connexion.</p>
      </div>
    );
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <Notice>{state.message}</Notice>}
      <Field name="displayName" label="Prénom ou pseudonyme" autoComplete="nickname" defaultValue={state.values?.displayName} errors={state.errors?.displayName} />
      <Field name="email" label="Adresse e-mail" type="email" autoComplete="email" defaultValue={state.values?.email} errors={state.errors?.email} />
      <Field
        name="password"
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        errors={state.errors?.password}
        hint={`Au moins ${PASSWORD_MIN} caractères, dont une lettre et un chiffre.`}
      />
      <Submit pending={pending}>Créer mon compte</Submit>
    </form>
  );
}

export function ResendVerificationForm({ email }: { email?: string }) {
  const [state, action, pending] = useActionState(resendVerificationAction, initial);
  if (state.done) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="flex items-center gap-3 text-sm">
      <input type="hidden" name="email" value={email ?? ""} />
      <button type="submit" disabled={pending} className="underline underline-offset-4 hover:text-signature">
        Renvoyer le lien de confirmation
      </button>
    </form>
  );
}

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmailAction, initial);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      {state.message && <Notice>{state.message}</Notice>}
      <Submit pending={pending}>Confirmer mon adresse</Submit>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestResetAction, initial);
  if (state.done) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field name="email" label="Adresse e-mail" type="email" autoComplete="email" defaultValue={state.values?.email} errors={state.errors?.email} />
      <Submit pending={pending}>Recevoir un lien</Submit>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.message && <Notice>{state.message}</Notice>}
      <Field
        name="password"
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        errors={state.errors?.password}
        hint={`Au moins ${PASSWORD_MIN} caractères, dont une lettre et un chiffre.`}
      />
      <Field name="confirm" label="Confirmer le mot de passe" type="password" autoComplete="new-password" errors={state.errors?.confirm} />
      <Submit pending={pending}>Changer le mot de passe</Submit>
    </form>
  );
}
