import Link from "next/link";
import { Container } from "@/components/ui/primitives";

const NAV = [
  { href: "/explorer", label: "Explorer" },
  { href: "/createurs", label: "Créateurs" },
  { href: "/ecoles", label: "Écoles" },
  { href: "/explorer?tri=new", label: "Nouveautés" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-display text-[1.9rem] leading-none tracking-tight">
        Signé<span className="text-signature">.</span>
      </span>
    </span>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/**
 * En-tête. Menu mobile en <details> : fonctionne sans JavaScript.
 * Le panier et le compte arrivent avec l'authentification (Sprint 2) et le panier (Sprint 4).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" aria-label="Signé, accueil">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden flex-1 items-center gap-6 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-signature">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <form action="/explorer" role="search" className="hidden items-center gap-2 rounded-full border border-line px-3 lg:flex">
            <SearchIcon />
            <label htmlFor="header-q" className="sr-only">
              Rechercher une pièce ou un créateur
            </label>
            <input id="header-q" name="q" placeholder="Une pièce, un créateur, une école…" className="h-9 w-64 bg-transparent text-sm outline-none placeholder:text-ink-3" />
          </form>
          <Link href="/explorer" aria-label="Rechercher" className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2 lg:hidden">
            <SearchIcon />
          </Link>
          <Link href="/devenir-createur" className="hidden rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-ink-2 sm:inline-flex">
            Devenir créateur
          </Link>
          <details className="group relative md:hidden">
            <summary aria-label="Menu" className="grid h-10 w-10 cursor-pointer place-items-center rounded-full hover:bg-paper-2">
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path className="group-open:hidden" d="M4 8h16M4 16h16" />
                <path className="hidden group-open:block" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </summary>
            <nav aria-label="Navigation mobile" className="fixed inset-x-0 top-16 border-b border-line bg-paper px-4 pb-8 pt-4 shadow-lg">
              <ul className="divide-y divide-line">
                {[...NAV, { href: "/devenir-createur", label: "Devenir créateur" }, { href: "/a-propos", label: "À propos" }, { href: "/aide", label: "Aide" }].map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="block py-4 font-display text-3xl">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
