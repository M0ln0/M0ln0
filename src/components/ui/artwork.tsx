/**
 * Visuels génératifs.
 *
 * Tant qu'une photo réelle n'est pas fournie (`Media.src`), Signé affiche une
 * composition déterministe : silhouette de l'objet selon sa sous-catégorie,
 * teintée de sa couleur réelle, sur un fond papier. Même graine, même image.
 * Aucun état, aucun JavaScript côté client.
 */
import type { MediaKind } from "@/types/domain";

export interface ArtworkHint {
  subcategory?: string;
  tint?: string;
}

/* PRNG déterministe (cyrb53 + mulberry32). */
function seedFrom(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return h1 >>> 0;
}

function rng(seed: string) {
  let a = seedFrom(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUNDS = ["#e8e1d3", "#ddd4c2", "#e7d7c6", "#d8ddd2", "#e5dbe0", "#d4dae0", "#ebe0cc", "#d9d0bf"];
const INKS = ["#c8391b", "#2b4a7a", "#2f5a45", "#b9802f", "#6e1f2a", "#3e7c99", "#161514", "#b75d69", "#5e7f6a"];

function pick<T>(r: () => number, xs: T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

/** Assombrit ou éclaircit une couleur hexadécimale. */
function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  const out = c.map((v) => Math.max(0, Math.min(255, Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* Silhouettes, viewBox 200 × 250. */
const SILHOUETTES: Record<string, string> = {
  vestes: "M70 35 L100 52 L130 35 L152 46 L168 192 L147 197 L140 98 L143 222 L57 222 L60 98 L53 197 L32 192 L48 46 Z",
  hauts: "M65 40 L85 32 Q100 47 115 32 L135 40 L166 70 L149 89 L135 79 L135 212 L65 212 L65 79 L51 89 L34 70 Z",
  maille: "M62 40 L85 32 Q100 47 115 32 L138 40 L158 60 L171 192 L152 194 L138 96 L138 207 L62 207 L62 96 L48 194 L29 192 L42 60 Z",
  robes: "M82 30 L92 30 Q100 43 108 30 L118 30 L123 70 L112 96 L156 226 L44 226 L88 96 L77 70 Z",
  pantalons: "M64 30 L136 30 L149 226 L110 226 L100 92 L90 226 L51 226 Z",
  chapeaux: "M52 158 Q50 62 100 56 Q150 62 148 158 Z M46 150 L154 150 L154 184 L46 184 Z",
  echarpes: "M72 36 L128 36 L128 152 L114 152 L114 214 L86 214 L86 152 L72 152 Z",
  sacs: "M48 102 L152 102 L160 218 L40 218 Z",
  "petite-maroquinerie": "M58 78 L142 78 Q148 78 148 84 L148 188 Q148 194 142 194 L58 194 Q52 194 52 188 L52 84 Q52 78 58 78 Z",
  ceramique: "M34 112 L166 112 Q161 202 100 202 Q39 202 34 112 Z M80 200 L120 200 L118 212 L82 212 Z",
  "art-de-la-table": "M60 88 L140 88 L132 204 L68 204 Z",
  mobilier: "M44 84 Q100 70 156 84 L156 98 Q100 112 44 98 Z M58 100 L66 100 L52 224 L44 224 Z M134 100 L142 100 L160 224 L152 224 Z M96 106 L104 106 L106 224 L98 224 Z",
  "textile-maison": "M40 58 L160 58 L160 214 L40 214 Z",
  affiches: "M46 32 L154 32 L154 214 L46 214 Z",
  carnets: "M56 44 L146 44 L146 204 L56 204 Z",
};

/** Détails dessinés par-dessus la silhouette (traits). */
function Details({ sub, ink }: { sub?: string; ink: string }) {
  const s = { stroke: ink, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, opacity: 0.55 };
  switch (sub) {
    case "vestes":
      return <path d="M100 52 L100 222 M100 52 L86 92 M100 52 L114 92 M70 150 L88 150 M112 150 L130 150" {...s} />;
    case "maille":
      return <path d="M62 196 L138 196 M70 196 L70 207 M80 196 L80 207 M90 196 L90 207 M100 196 L100 207 M110 196 L110 207 M120 196 L120 207 M130 196 L130 207" {...s} />;
    case "pantalons":
      return <path d="M64 44 L136 44 M100 30 L100 60" {...s} />;
    case "chapeaux":
      return <path d="M58 150 L58 184 M72 150 L72 184 M86 150 L86 184 M100 150 L100 184 M114 150 L114 184 M128 150 L128 184 M142 150 L142 184" {...s} />;
    case "echarpes":
      return <path d="M88 214 L88 228 M94 214 L94 228 M100 214 L100 228 M106 214 L106 228 M112 214 L112 228" {...s} opacity={0.9} />;
    case "sacs":
      return <path d="M70 102 Q100 18 130 102" {...s} strokeWidth={5} opacity={0.9} />;
    case "petite-maroquinerie":
      return <path d="M62 104 L138 104 M62 126 L138 126 M62 148 L138 148" {...s} />;
    case "affiches":
      return (
        <g opacity={0.9}>
          <circle cx="118" cy="86" r="22" fill={shade(ink, 0.35)} />
          <path d="M46 170 Q80 120 110 160 Q132 138 154 158 L154 214 L46 214 Z" fill={shade(ink, -0.25)} />
        </g>
      );
    case "carnets":
      return <path d="M68 44 L68 204" {...s} strokeWidth={3} />;
    default:
      return null;
  }
}

/** Bijoux : dessinés au trait, pas en aplat. */
function Jewelry({ sub, ink }: { sub?: string; ink: string }) {
  const stroke = { stroke: ink, fill: "none", strokeLinecap: "round" as const };
  if (sub === "bagues")
    return (
      <g>
        <ellipse cx="100" cy="150" rx="46" ry="42" {...stroke} strokeWidth={11} />
        <ellipse cx="100" cy="104" rx="22" ry="17" fill={ink} />
        <ellipse cx="94" cy="99" rx="7" ry="4" fill="white" opacity={0.45} />
      </g>
    );
  if (sub === "colliers")
    return (
      <g>
        <path d="M44 30 Q100 200 156 30" {...stroke} strokeWidth={3} />
        <ellipse cx="100" cy="174" rx="18" ry="24" fill={ink} />
        <ellipse cx="94" cy="166" rx="5" ry="7" fill="white" opacity={0.4} />
      </g>
    );
  return (
    <g>
      <path d="M72 70 L72 88 M128 70 L128 88" {...stroke} strokeWidth={3} />
      <circle cx="72" cy="122" r="30" {...stroke} strokeWidth={7} />
      <circle cx="128" cy="122" r="30" {...stroke} strokeWidth={7} />
    </g>
  );
}

type Texture = "stripes" | "dots" | "weave" | "plain";

function Pattern({ id, texture, ink, scale = 1 }: { id: string; texture: Texture; ink: string; scale?: number }) {
  const size = 10 * scale;
  if (texture === "stripes")
    return (
      <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width={size} height={size} fill={ink} />
        <rect width={size / 2.6} height={size} fill={shade(ink, luminance(ink) > 0.5 ? -0.12 : 0.12)} />
      </pattern>
    );
  if (texture === "dots")
    return (
      <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
        <rect width={size} height={size} fill={ink} />
        <circle cx={size / 2} cy={size / 2} r={size / 7} fill={shade(ink, luminance(ink) > 0.5 ? -0.18 : 0.18)} />
      </pattern>
    );
  if (texture === "weave")
    return (
      <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
        <rect width={size} height={size} fill={ink} />
        <path d={`M0 ${size / 2} H${size} M${size / 2} 0 V${size}`} stroke={shade(ink, luminance(ink) > 0.5 ? -0.1 : 0.1)} strokeWidth={size / 5} />
      </pattern>
    );
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
      <rect width={size} height={size} fill={ink} />
    </pattern>
  );
}

const JEWELRY = new Set(["bagues", "colliers", "boucles"]);

export function Artwork({ seed, kind, hint = {}, className }: { seed: string; kind: MediaKind; hint?: ArtworkHint; className?: string }) {
  const r = rng(seed);
  const ground = pick(r, GROUNDS);
  const ink = hint.tint ?? pick(r, INKS);
  const id = `a${seedFrom(seed + kind).toString(36)}`;
  const common = {
    role: "presentation" as const,
    "aria-hidden": true,
    preserveAspectRatio: "xMidYMid slice",
    className,
  };

  if (kind === "portrait") {
    const skin = pick(r, ["#e9c8a8", "#c99a74", "#8d5a3b", "#f0d5bd", "#b27a55", "#5e3a26"]);
    const hair = pick(r, ["#1f1a17", "#4a3021", "#8a5a2b", "#2b2320", "#c9a26b"]);
    const hairStyle = Math.floor(r() * 3);
    return (
      <svg viewBox="0 0 200 250" {...common}>
        <rect width="200" height="250" fill={ground} />
        <circle cx={40 + r() * 120} cy={40 + r() * 60} r={30 + r() * 30} fill={shade(ink, 0.55)} opacity={0.6} />
        {hairStyle === 2 && <path d="M52 110 Q50 40 100 40 Q150 40 148 110 L150 180 L50 180 Z" fill={hair} />}
        <rect x="88" y="140" width="24" height="30" fill={shade(skin, -0.12)} />
        <ellipse cx="100" cy="110" rx="36" ry="44" fill={skin} />
        {hairStyle === 0 && <path d="M64 104 Q62 62 100 60 Q138 62 136 104 Q124 80 100 78 Q76 80 64 104 Z" fill={hair} />}
        {hairStyle === 1 && (
          <g fill={hair}>
            <circle cx="100" cy="56" r="20" />
            <path d="M64 106 Q62 64 100 64 Q138 64 136 106 Q120 84 100 84 Q80 84 64 106 Z" />
          </g>
        )}
        {hairStyle === 2 && <path d="M64 100 Q64 62 100 62 Q136 62 136 100 Q110 86 64 100 Z" fill={hair} />}
        <path d="M16 250 Q24 172 100 166 Q176 172 184 250 Z" fill={ink} />
        <path d="M84 168 L100 196 L116 168" fill="none" stroke={shade(ink, luminance(ink) > 0.5 ? -0.25 : 0.25)} strokeWidth="3" />
      </svg>
    );
  }

  if (kind === "cover" || kind === "atelier") {
    const accent = pick(r, INKS);
    const second = shade(pick(r, GROUNDS), -0.18);
    const variant = Math.floor(r() * 3);
    return (
      <svg viewBox="0 0 400 250" {...common}>
        <defs>
          <Pattern id={id} texture={pick(r, ["stripes", "dots", "weave"] as Texture[])} ink={second} scale={1.4} />
        </defs>
        <rect width="400" height="250" fill={ground} />
        {variant === 0 && (
          <>
            <path d={`M${60 + r() * 40} 250 L${60 + r() * 40} 120 A 70 70 0 0 1 ${200 + r() * 40} 120 L ${200 + r() * 40} 250 Z`} fill={`url(#${id})`} />
            <circle cx={290 + r() * 50} cy={70 + r() * 40} r={34 + r() * 16} fill={accent} />
          </>
        )}
        {variant === 1 && (
          <>
            <rect x={-20} y={150 + r() * 30} width="440" height="140" fill={`url(#${id})`} />
            <circle cx={120 + r() * 160} cy={120} r={60 + r() * 20} fill={accent} opacity={0.9} />
            <rect x={40 + r() * 40} y={40} width="10" height="180" fill={shade(accent, -0.3)} />
          </>
        )}
        {variant === 2 && (
          <>
            <rect x={200 + r() * 40} y={0} width="200" height="250" fill={`url(#${id})`} />
            <path d={`M40 ${200 - r() * 30} Q 140 ${40 + r() * 40} 260 ${190 - r() * 30}`} stroke={accent} strokeWidth="16" fill="none" strokeLinecap="round" />
            <circle cx={70} cy={60} r={18} fill={shade(accent, 0.2)} />
          </>
        )}
      </svg>
    );
  }

  const sub = hint.subcategory;
  const texture: Texture = pick(r, ["plain", "plain", "stripes", "dots", "weave"] as Texture[]);

  if (kind === "detail") {
    return (
      <svg viewBox="0 0 200 250" {...common}>
        <defs>
          <Pattern id={id} texture={texture === "plain" ? "weave" : texture} ink={ink} scale={2.2} />
        </defs>
        <rect width="200" height="250" fill={`url(#${id})`} />
        <path d="M0 190 Q100 150 200 200 L200 250 L0 250 Z" fill={shade(ink, -0.2)} opacity={0.35} />
        <path d="M-10 120 Q60 90 210 130" stroke={shade(ink, 0.4)} strokeWidth="2" strokeDasharray="6 5" fill="none" />
      </svg>
    );
  }

  const offset = kind === "main" ? { x: 0, y: 0, s: 1 } : { x: (r() - 0.5) * 30, y: 8, s: 0.86 };
  const floor = shade(ground, -0.06);
  const body =
    sub && JEWELRY.has(sub) ? (
      <Jewelry sub={sub} ink={ink} />
    ) : (
      <>
        <path
          d={SILHOUETTES[sub ?? ""] ?? SILHOUETTES.hauts}
          fill={`url(#${id})`}
          stroke={shade(ink, luminance(ink) > 0.6 ? -0.3 : -0.15)}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <Details sub={sub} ink={luminance(ink) > 0.55 ? shade(ink, -0.5) : shade(ink, 0.5)} />
      </>
    );

  return (
    <svg viewBox="0 0 200 250" {...common}>
      <defs>
        <Pattern id={id} texture={texture} ink={ink} />
      </defs>
      <rect width="200" height="250" fill={kind === "worn" ? shade(ground, -0.04) : ground} />
      {kind === "worn" && <circle cx="100" cy="70" r="120" fill={shade(ground, 0.25)} opacity={0.5} />}
      <ellipse cx="100" cy="232" rx="70" ry="8" fill={floor} />
      <g transform={`translate(${100 + offset.x} ${125 + offset.y}) scale(${offset.s}) translate(-100 -125)`}>{body}</g>
    </svg>
  );
}
