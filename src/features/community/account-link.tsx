"use client";

import Link from "next/link";
import { useCommunity } from "./community-provider";

export function AccountLink() {
  const { user, ready } = useCommunity();
  const href = user ? "/compte" : "/connexion";
  const label = user ? `Mon compte (${user.displayName})` : "Se connecter";
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="grid h-10 min-w-10 place-items-center rounded-full px-2 text-sm hover:bg-paper-2"
      data-ready={ready}
    >
      {user ? (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink font-mono text-xs text-paper">{user.displayName.trim().charAt(0).toUpperCase()}</span>
      ) : (
        <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      )}
    </Link>
  );
}
