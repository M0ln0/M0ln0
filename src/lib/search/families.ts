/**
 * Regroupe les couleurs et matières saisies librement par les créateurs
 * en familles filtrables (« Bleu crique » → bleu, « Laine d'agneau » → laine).
 */
import { normalize } from "./normalize";

export const COLOR_FAMILIES = {
  noir: "Noir",
  blanc: "Blanc et écru",
  gris: "Gris",
  beige: "Beige et naturel",
  marron: "Marron",
  rouge: "Rouge",
  rose: "Rose",
  orange: "Orange",
  jaune: "Jaune et doré",
  vert: "Vert",
  bleu: "Bleu",
  violet: "Violet",
  argent: "Argent",
  multicolore: "Multicolore",
} as const;

export type ColorFamily = keyof typeof COLOR_FAMILIES;

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

export function colorFamily(name: string, hex: string): ColorFamily {
  const n = normalize(name);
  if (n.includes("multicolor") || n.includes("assortiment") || n.includes("imprime")) return "multicolore";
  if (n.includes("argent")) return "argent";
  const [h, s, l] = hexToHsl(hex);
  if (l < 0.16) return "noir";
  if (l > 0.82 && s < 0.5) return "blanc";
  if (s < 0.12) return l > 0.75 ? "blanc" : "gris";
  if (s < 0.35 && l > 0.6 && h >= 20 && h < 60) return "beige";
  if (h < 15 || h >= 345) return l > 0.65 ? "rose" : "rouge";
  if (h < 40) return l < 0.45 ? "marron" : s < 0.55 && l > 0.55 ? "beige" : "orange";
  if (h < 65) return l < 0.4 ? "marron" : s < 0.4 ? "beige" : "jaune";
  if (h < 170) return "vert";
  if (h < 255) return "bleu";
  if (h < 300) return "violet";
  return "rose";
}

export const MATERIAL_FAMILIES: Record<string, { label: string; keywords: string[] }> = {
  laine: { label: "Laine", keywords: ["laine", "merinos", "mohair"] },
  coton: { label: "Coton", keywords: ["coton", "jersey", "popeline", "twill"] },
  lin: { label: "Lin", keywords: ["lin"] },
  soie: { label: "Soie", keywords: ["soie", "soies"] },
  cuir: { label: "Cuir", keywords: ["cuir"] },
  argent: { label: "Argent", keywords: ["argent"] },
  laiton: { label: "Laiton", keywords: ["laiton", "vermeil"] },
  verre: { label: "Verre", keywords: ["verre"] },
  bois: { label: "Bois", keywords: ["chene", "frene", "bois"] },
  ceramique: { label: "Céramique", keywords: ["gres", "email", "porcelaine", "faience"] },
  papier: { label: "Papier", keywords: ["papier"] },
  toile: { label: "Toile technique", keywords: ["toile", "ripstop"] },
  chanvre: { label: "Chanvre", keywords: ["chanvre"] },
};

export function materialFamilies(materials: string[]): string[] {
  const words = new Set(materials.flatMap((m) => normalize(m).split(" ")));
  return Object.entries(MATERIAL_FAMILIES)
    .filter(([, f]) => f.keywords.some((k) => words.has(k)))
    .map(([key]) => key);
}
