import { createHash, randomBytes } from "node:crypto";

/** Jeton opaque transmis au navigateur ou par e-mail. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Seul l'empreinte du jeton est conservée côté serveur. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
