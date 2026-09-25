"use client";

/**
 * État personnel côté navigateur : utilisateur connecté, favoris, suivis.
 * Chargé depuis /api/moi, rechargé à chaque changement de page pour refléter
 * une connexion ou une déconnexion. Les mises à jour sont optimistes puis
 * confirmées par une Server Action qui revérifie tout côté serveur.
 */
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setFavoriteAction, setFollowAction, type ToggleResult } from "./actions";

interface CommunityState {
  ready: boolean;
  user: { displayName: string } | null;
  favorites: Set<string>;
  follows: Set<string>;
}

interface CommunityApi extends CommunityState {
  toggleFavorite(productId: string): Promise<void>;
  toggleFollow(creatorId: string): Promise<void>;
}

const Ctx = createContext<CommunityApi | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<CommunityState>({ ready: false, user: null, favorites: new Set(), follows: new Set() });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/moi", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setState({ ready: true, user: data.user, favorites: new Set(data.favorites), follows: new Set(data.follows) });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, ready: true }));
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const toggle = useCallback(
    async (key: "favorites" | "follows", id: string, action: (id: string, on: boolean) => Promise<ToggleResult>) => {
      if (!state.user) {
        router.push(`/connexion?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const on = !state[key].has(id);
      const apply = (value: boolean) =>
        setState((s) => {
          const next = new Set(s[key]);
          if (value) next.add(id);
          else next.delete(id);
          return { ...s, [key]: next };
        });
      apply(on);
      try {
        const r = await action(id, on);
        if (!r.ok) {
          apply(!on);
          if (r.reason === "auth") router.push(`/connexion?next=${encodeURIComponent(pathname)}`);
        }
      } catch {
        apply(!on);
      }
    },
    [state, router, pathname],
  );

  const api = useMemo<CommunityApi>(
    () => ({
      ...state,
      toggleFavorite: (id) => toggle("favorites", id, setFavoriteAction),
      toggleFollow: (id) => toggle("follows", id, setFollowAction),
    }),
    [state, toggle],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCommunity(): CommunityApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommunity doit être utilisé dans CommunityProvider");
  return ctx;
}
