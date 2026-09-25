/**
 * Contrôle optimiste : sans cookie de session, l'espace compte redirige vers
 * la connexion. La vérification réelle a lieu dans chaque page et chaque
 * Server Action (services/auth/session.ts) : ce proxy n'est jamais la seule
 * barrière. L'administration n'est pas traitée ici : elle répond 404 elle-même.
 */
import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "signe_session";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/compte", "/compte/:path*"],
};
