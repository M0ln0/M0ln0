/**
 * Utilitaires de construction des données de démonstration.
 * Rien dans ce dossier ne doit être importé par l'interface :
 * seul le dépôt « démo » (`services/repositories/demo`) y accède.
 */
import type { Media, MediaKind } from "@/types/domain";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function media(seed: string, alt: string, kind: MediaKind, position = 0, src?: string): Media {
  return { id: `media-${seed}-${position}`, seed, alt, kind, position, src };
}
