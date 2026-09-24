"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Partage d'une boutique ou d'un produit.
 * - Sur mobile, le partage natif propose directement Instagram, TikTok, WhatsApp…
 * - Instagram et TikTok n'ont pas d'URL de partage web : on copie le lien
 *   et on indique où le coller (story, bio, message).
 */
export function ShareMenu({ path, title, text, className }: { path: string; title: string; text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [origin, setOrigin] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Détection après hydratation : le rendu serveur ne connaît pas le navigateur.
    /* eslint-disable react-hooks/set-state-in-effect */
    setCanNativeShare(typeof navigator.share === "function");
    setOrigin(window.location.origin);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const url = () => new URL(path, origin || window.location.origin).toString();

  async function copy(hint: string) {
    try {
      await navigator.clipboard.writeText(url());
      setMessage(hint);
    } catch {
      setMessage("Copie impossible. Sélectionnez l'adresse dans la barre du navigateur.");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url: url() });
      setOpen(false);
    } catch {
      /* partage annulé par l'utilisateur */
    }
  }

  const item = "flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-paper-2";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:border-ink"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
        </svg>
        Partager
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-card border border-line bg-paper shadow-xl">
          {canNativeShare && (
            <button role="menuitem" type="button" className={item} onClick={nativeShare}>
              Partager depuis le téléphone <span aria-hidden>↗</span>
            </button>
          )}
          <button role="menuitem" type="button" className={item} onClick={() => copy("Lien copié. Collez-le dans une story Instagram avec le sticker « Lien ».")}>
            Instagram <span className="eyebrow">Story</span>
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => copy("Lien copié. Collez-le dans votre bio ou un message TikTok.")}>
            TikTok <span className="eyebrow">Bio · DM</span>
          </button>
          <a
            role="menuitem"
            className={item}
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${origin}${path}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp <span aria-hidden>↗</span>
          </a>
          <button role="menuitem" type="button" className={item} onClick={() => copy("Lien copié.")}>
            Copier le lien
          </button>
          <p aria-live="polite" className={cn("px-4 text-xs text-success", message ? "py-3" : "py-0")}>
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
