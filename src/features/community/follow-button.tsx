"use client";

import { cn } from "@/lib/cn";
import { useCommunity } from "./community-provider";

export function FollowButton({ creatorId, name, className }: { creatorId: string; name: string; className?: string }) {
  const { follows, toggleFollow, ready } = useCommunity();
  const on = follows.has(creatorId);
  return (
    <button
      type="button"
      onClick={() => toggleFollow(creatorId)}
      aria-pressed={on}
      aria-label={on ? `Ne plus suivre ${name}` : `Suivre ${name}`}
      disabled={!ready}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors",
        on ? "border border-ink text-ink hover:border-signature hover:text-signature" : "bg-ink text-paper hover:bg-ink-2",
        className,
      )}
    >
      {on ? "Suivi" : "Suivre"}
    </button>
  );
}
