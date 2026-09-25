import Link from "next/link";
import { cn } from "@/lib/cn";
import { signOutAction } from "@/features/account/actions";

const LINKS = [
  { href: "/compte", label: "Mon compte" },
  { href: "/compte/favoris", label: "Favoris" },
  { href: "/compte/createurs-suivis", label: "Créateurs suivis" },
];

export function AccountNav({ current }: { current: string }) {
  return (
    <nav aria-label="Mon compte" className="scroll-row -mx-4 auto-cols-max items-center gap-2 border-b border-line px-4 pb-4 sm:mx-0 sm:px-0">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={current === l.href ? "page" : undefined}
          className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm", current === l.href ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}
        >
          {l.label}
        </Link>
      ))}
      <form action={signOutAction}>
        <button type="submit" className="whitespace-nowrap px-4 py-2 text-sm text-ink-3 underline-offset-4 hover:text-ink hover:underline">
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
