import Link from "next/link";
import { Media } from "@/components/ui/media";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import { STAGE_LABELS } from "@/lib/labels";
import type { CreatorCard as CreatorCardData } from "@/services/repositories/catalog-repository";

/** Carte créateur : un visage, un nom, une phrase, un aperçu des pièces. */
export function CreatorCard({ data, className }: { data: CreatorCardData; className?: string }) {
  const { creator, school, preview } = data;
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
        <Media media={creator.portrait} ratio="aspect-[4/5]" className="rounded-card" sizes="(min-width: 1024px) 22vw, 70vw" />
        {creator.stage === "student" && (
          <Badge className="absolute left-2 top-2">{STAGE_LABELS.student}</Badge>
        )}
        {preview.length > 0 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {preview.slice(0, 2).map((p) => (
              <Media
                key={p.product.id}
                media={p.product.images[0]}
                hint={{ subcategory: p.product.subcategory, tint: p.product.colors[0]?.hex }}
                ratio="aspect-square"
                className="w-12 rounded-sm ring-2 ring-paper sm:w-14"
                sizes="60px"
              />
            ))}
          </div>
        )}
      </div>
      <p className="eyebrow mt-3">
        {creator.city}
        {school ? ` · ${school.shortName}` : ""}
      </p>
      <h3 className="mt-1 font-display text-2xl leading-none">
        <Link href={`/createurs/${creator.slug}`} className="after:absolute after:inset-0">
          {creator.brandName}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-ink-3">
        {creator.realName} · {creator.specialty}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-ink-2">{creator.tagline}</p>
      <p className="mt-2 font-mono text-xs text-ink-3">{formatCount(creator.followerCount)} abonnés</p>
    </article>
  );
}

/** Rangée horizontale sur mobile, grille sur grand écran. */
export function CreatorRow({ items }: { items: CreatorCardData[] }) {
  return (
    <div className="scroll-row -mx-4 auto-cols-[72%] gap-4 px-4 sm:mx-0 sm:auto-cols-[40%] sm:px-0 lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
      {items.map((c) => (
        <CreatorCard key={c.creator.id} data={c} />
      ))}
    </div>
  );
}
