import type { CreatorStage, Edition, Product, SchoolKind, Universe } from "@/types/domain";

export const UNIVERSE_LABELS: Record<Universe, string> = {
  upcycling: "Upcycling",
  tailoring: "Tailleur",
  knitwear: "Maille",
  streetwear: "Streetwear",
  jewelry: "Bijou",
  leather: "Cuir",
  ceramics: "Céramique",
  print: "Image imprimée",
  furniture: "Mobilier",
  textile_art: "Art textile",
  minimalism: "Minimalisme",
  romantic: "Romantique",
};

export const STAGE_LABELS: Record<CreatorStage, string> = {
  student: "Étudiant·e",
  graduate: "Jeune diplômé·e",
  independent_brand: "Marque indépendante",
};

export const SCHOOL_KIND_LABELS: Record<SchoolKind, string> = {
  mode: "Mode",
  design: "Design",
  arts_appliques: "Arts appliqués",
  beaux_arts: "Beaux-arts",
};

export const EDITION_LABELS: Record<Edition, string> = {
  unique: "Pièce unique",
  limited: "Série limitée",
  made_to_order: "Sur commande",
  ongoing: "Petite série",
};

/** « Série de 12 », « Pièce unique », « Sur commande · 14 jours ». */
export function editionDetail(p: Pick<Product, "edition" | "editionSize" | "leadTimeDays">): string {
  if (p.edition === "limited" && p.editionSize) return `Série de ${p.editionSize}`;
  if (p.edition === "made_to_order" && p.leadTimeDays) return `Sur commande · ${p.leadTimeDays} jours`;
  return EDITION_LABELS[p.edition];
}
