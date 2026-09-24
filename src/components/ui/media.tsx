import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Media as MediaT } from "@/types/domain";
import { Artwork, type ArtworkHint } from "./artwork";

/**
 * Affiche une image : la photo si `src` est renseigné (optimisée par next/image,
 * chargement différé par défaut), sinon le visuel génératif.
 * Le conteneur fixe le ratio pour éviter tout décalage de mise en page.
 */
export function Media({
  media,
  hint,
  ratio = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className,
}: {
  media: MediaT;
  hint?: ArtworkHint;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-paper-2", ratio, className)}>
      {media.src ? (
        <Image src={media.src} alt={media.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <>
          <Artwork seed={media.seed} kind={media.kind} hint={hint} className="absolute inset-0 h-full w-full" />
          <span className="sr-only">{media.alt}</span>
        </>
      )}
    </div>
  );
}
