"use client";

import { cn } from "@/lib/cn";
import { useCommunity } from "./community-provider";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z" />
    </svg>
  );
}

/** Cœur de sauvegarde. Variante « icon » sur les cartes, « full » sur la fiche produit. */
export function FavoriteButton({ productId, title, variant = "icon", className }: { productId: string; title: string; variant?: "icon" | "full"; className?: string }) {
  const { favorites, toggleFavorite, ready } = useCommunity();
  const on = favorites.has(productId);
  const label = on ? `Retirer ${title} des favoris` : `Ajouter ${title} aux favoris`;
  if (variant === "full")
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(productId)}
        aria-pressed={on}
        disabled={!ready}
        className={cn("inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors", on ? "border-signature text-signature" : "border-line hover:border-ink", className)}
      >
        <Heart filled={on} />
        {on ? "Dans vos favoris" : "Ajouter aux favoris"}
      </button>
    );
  return (
    <button
      type="button"
      onClick={() => toggleFavorite(productId)}
      aria-pressed={on}
      aria-label={label}
      title={label}
      disabled={!ready}
      className={cn("grid h-9 w-9 place-items-center rounded-full bg-paper/90 shadow-sm transition-colors hover:bg-paper", on ? "text-signature" : "text-ink", className)}
    >
      <Heart filled={on} />
    </button>
  );
}
