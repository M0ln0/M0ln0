import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CommunityProvider } from "@/features/community/community-provider";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Signé — Créateurs indépendants de mode et de design",
    template: "%s · Signé",
  },
  description: "Découvrez les futurs créateurs avant qu'ils deviennent connus. Pièces uniques, séries limitées et jeunes marques indépendantes.",
  openGraph: { siteName: "Signé", locale: "fr_FR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f5f2eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          Aller au contenu
        </a>
        <CommunityProvider>
          <SiteHeader />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </CommunityProvider>
      </body>
    </html>
  );
}
