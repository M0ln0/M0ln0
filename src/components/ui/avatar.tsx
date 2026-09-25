import { cn } from "@/lib/cn";
import type { Media as MediaT } from "@/types/domain";
import { Media } from "./media";

export function Avatar({ media, size = 32, className }: { media: MediaT; size?: number; className?: string }) {
  return (
    <span className={cn("inline-block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size }}>
      <Media media={media} ratio="aspect-square" sizes={`${size * 2}px`} />
    </span>
  );
}
