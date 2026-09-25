import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Media } from "@/components/ui/media";
import { Badge } from "@/components/ui/primitives";
import { FavoriteButton } from "@/features/community/favorite-button";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { editionDetail } from "@/lib/labels";
import type { ProductCardView } from "@/types/domain";

/**
 * Carte produit. Le créateur apparaît au-dessus du titre : on découvre
 * une personne autant qu'un objet.
 */
export function ProductCard({ view, priority, className }: { view: ProductCardView; priority?: boolean; className?: string }) {
  const { product, creator, totalStock } = view;
  const soldOut = totalStock === 0;
  const lastOne = totalStock === 1 && product.edition !== "made_to_order";
  const main = product.images[0];
  const hint = { subcategory: product.subcategory, tint: product.colors[0]?.hex };
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
        <Media media={main} hint={hint} priority={priority} className="rounded-card transition-[filter] duration-500 group-hover:brightness-95" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.edition === "unique" && <Badge tone="ink">Pièce unique</Badge>}
          {soldOut && <Badge>Épuisé</Badge>}
          {!soldOut && lastOne && product.edition !== "unique" && <Badge tone="signature">Dernière pièce</Badge>}
        </div>
        <FavoriteButton productId={product.id} title={product.title} className="absolute right-2 top-2 z-10" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Avatar media={creator.portrait} size={22} />
        <Link href={`/createurs/${creator.slug}`} className="relative z-10 truncate text-xs font-medium hover:underline">
          {creator.brandName}
        </Link>
        <span className="truncate text-xs text-ink-3">· {creator.city}</span>
      </div>
      <h3 className="mt-1 font-display text-xl leading-tight">
        <Link href={`/produits/${product.slug}`} className="after:absolute after:inset-0">
          {product.title}
        </Link>
      </h3>
      <div className="mt-1 flex items-baseline justify-between gap-2 text-sm">
        <span className={cn("font-medium", soldOut && "text-ink-3 line-through")}>{formatPrice(product.priceCents)}</span>
        <span className="truncate text-xs text-ink-3">{editionDetail(product)}</span>
      </div>
    </article>
  );
}

export function ProductGrid({ items, priorityCount = 0 }: { items: ProductCardView[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
      {items.map((v, i) => (
        <ProductCard key={v.product.id} view={v} priority={i < priorityCount} />
      ))}
    </div>
  );
}
