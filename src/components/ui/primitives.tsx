import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10", className)} {...props} />;
}

type Variant = "primary" | "signature" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2",
  signature: "bg-signature text-white hover:bg-signature-dark",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink underline-offset-4 hover:underline",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    variant !== "ghost" && SIZES[size],
    className,
  );
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/** En-tête de section éditorial : étiquette, titre en capitales serif, lien optionnel. */
export function SectionHeader({
  eyebrow,
  title,
  intro,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="font-display text-headline">{title}</h2>
        {intro && <p className="mt-4 text-ink-2">{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium">
          {action.label}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      )}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "signature" | "ink" | "success"; className?: string }) {
  const tones = {
    neutral: "bg-paper/90 text-ink border border-line",
    signature: "bg-signature text-white",
    ink: "bg-ink text-paper",
    success: "bg-success text-white",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex text-signature", className)} role="img" aria-label={`${value.toLocaleString("fr-FR")} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden className={i <= full ? "" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-3xl">{title}</p>
      {children && <div className="mx-auto mt-3 max-w-md text-ink-2">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1 font-mono text-sm">
      {page > 1 && (
        <Link className="px-3 py-2 hover:underline" href={hrefFor(page - 1)} rel="prev">
          ← Précédent
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-2 text-ink-3">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn("grid h-9 min-w-9 place-items-center rounded-full px-2", p === page ? "bg-ink text-paper" : "hover:bg-paper-2")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link className="px-3 py-2 hover:underline" href={hrefFor(page + 1)} rel="next">
          Suivant →
        </Link>
      )}
    </nav>
  );
}
