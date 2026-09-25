import type { Collection } from "@/types/domain";
import { media } from "./builders";

function collection(creatorSlug: string, slug: string, title: string, season: string, description: string, publishedAt: string): Collection {
  return {
    id: `col-${slug}`,
    slug,
    creatorId: `cr-${creatorSlug}`,
    title,
    season,
    description,
    cover: media(`collection-${slug}`, `Collection ${title}`, "cover"),
    publishedAt,
  };
}

export const collections: Collection[] = [
  collection("atelier-nova", "bleus-de-travail", "Bleus de travail", "Automne 2026", "Vestes et pantalons recoupés dans des toiles de travail des années 60.", "2026-09-01T09:00:00.000Z"),
  collection("maison-oblique", "equilibres", "Équilibres", "Collection permanente", "Tabourets, étagères et bougeoirs au déséquilibre maîtrisé.", "2026-06-10T09:00:00.000Z"),
  collection("fil-rouge-studio", "stock-dormant", "Stock dormant", "Hiver 2026", "Maille tricotée dans des fils récupérés auprès des filatures du Nord.", "2026-09-08T09:00:00.000Z"),
  collection("ceramiques-lune", "calanques", "Calanques", "Été 2026", "Bols, tasses et assiettes aux émaux de mer.", "2026-06-20T09:00:00.000Z"),
  collection("soline-a", "gouttes", "Gouttes", "Collection permanente", "Bagues et colliers en argent recyclé coulés à la cire perdue.", "2026-06-05T09:00:00.000Z"),
  collection("kori", "noragi", "Noragi", "Automne 2026", "Vestes et pantalons inspirés des vêtements de travail japonais.", "2026-08-25T09:00:00.000Z"),
  collection("maison-verveine", "quatorze-foulards", "Quatorze foulards", "Été 2026", "Robes et blouses assemblées à partir de soies anciennes.", "2026-07-10T09:00:00.000Z"),
  collection("atelier-sable", "dix", "Dix", "Collection permanente", "Dix pièces, trois couleurs, une garde-robe complète.", "2026-08-12T09:00:00.000Z"),
  collection("papier-grain", "villes-inventees", "Villes inventées", "Automne 2026", "Risographies de villes dessinées d'après des cartes postales trouvées.", "2026-09-12T09:00:00.000Z"),
];
