/**
 * Limiteur de tentatives à fenêtre fixe, en mémoire d'un processus.
 * Suffisant pour un serveur unique ; à remplacer par un stockage partagé
 * (base ou cache) dès qu'il y a plusieurs instances.
 */
export interface RateLimiter {
  /** Enregistre une tentative et indique si elle est autorisée. */
  hit(key: string): { allowed: boolean; retryAfterSeconds: number };
  reset(key: string): void;
}

export function createRateLimiter({ limit, windowMs, now = () => Date.now() }: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    hit(key) {
      const t = now();
      const b = buckets.get(key);
      if (!b || b.resetAt <= t) {
        buckets.set(key, { count: 1, resetAt: t + windowMs });
        if (buckets.size > 10_000) {
          for (const [k, v] of buckets) if (v.resetAt <= t) buckets.delete(k);
        }
        return { allowed: true, retryAfterSeconds: 0 };
      }
      b.count += 1;
      const allowed = b.count <= limit;
      return { allowed, retryAfterSeconds: allowed ? 0 : Math.ceil((b.resetAt - t) / 1000) };
    },
    reset(key) {
      buckets.delete(key);
    },
  };
}
