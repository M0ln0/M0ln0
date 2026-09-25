import type { ReactNode } from "react";
import { Container } from "@/components/ui/primitives";

/** Mise en page commune aux pages d'authentification. */
export function AuthShell({ eyebrow, title, intro, children, aside }: { eyebrow: string; title: ReactNode; intro?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <Container className="grid gap-12 py-12 sm:py-20 lg:grid-cols-[1fr_440px] lg:gap-24">
      <div className="lg:pt-6">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-headline">{title}</h1>
        {intro && <p className="mt-4 max-w-md text-ink-2">{intro}</p>}
        {aside && <div className="mt-10 hidden lg:block">{aside}</div>}
      </div>
      <div className="rounded-card border border-line bg-paper p-6 sm:p-8">{children}</div>
    </Container>
  );
}
