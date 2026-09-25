import type { CategorySlug, Color, Edition, Product, ProductVariant } from "@/types/domain";
import { media, slugify } from "./builders";

interface Spec {
  creator: string;
  title: string;
  collection?: string;
  category: CategorySlug;
  sub: string;
  price: number;
  edition: Edition;
  editionSize?: number;
  leadTimeDays?: number;
  materials: string[];
  colors: [string, string][];
  sizes?: string[];
  /** Stock par variante, dans l'ordre taille puis couleur. Le dernier chiffre est répété. */
  stock: number[];
  popularity: number;
  favorites: number;
  createdAt: string;
  description: string;
  story?: string;
  /** Le produit se porte : ajoute une photo portée. */
  worn?: boolean;
}

function product(s: Spec): Product {
  const slug = slugify(`${s.title}-${s.creator}`);
  const id = `prd-${slug}`;
  const colors: Color[] = s.colors.map(([name, hex]) => ({ name, hex }));
  const sizes = s.sizes ?? [];
  const combos: { size?: string; color?: string }[] = [];
  const sizeList = sizes.length ? sizes : [undefined];
  const colorList = colors.length > 1 ? colors.map((c) => c.name) : [colors[0]?.name];
  for (const size of sizeList) for (const color of colorList) combos.push({ size, color });

  const variants: ProductVariant[] = combos.map((c, i) => ({
    id: `${id}-v${i + 1}`,
    productId: id,
    sku: `${slug.slice(0, 18).toUpperCase()}-${i + 1}`,
    size: c.size,
    color: c.color,
    stock: s.stock[Math.min(i, s.stock.length - 1)],
  }));

  const images = [
    media(`${slug}-main`, s.title, "main", 0),
    media(`${slug}-detail`, `${s.title}, détail de la matière`, "detail", 1),
    s.worn
      ? media(`${slug}-worn`, `${s.title}, porté`, "worn", 2)
      : media(`${slug}-alt`, `${s.title}, autre vue`, "alternate", 2),
  ];

  return {
    id,
    slug,
    creatorId: `cr-${s.creator}`,
    collectionId: s.collection ? `col-${s.collection}` : undefined,
    title: s.title,
    description: s.description,
    story: s.story,
    category: s.category,
    subcategory: s.sub,
    priceCents: Math.round(s.price * 100),
    images,
    materials: s.materials,
    colors,
    sizes,
    variants,
    edition: s.edition,
    editionSize: s.editionSize,
    leadTimeDays: s.leadTimeDays,
    status: "published",
    popularity: s.popularity,
    favoriteCount: s.favorites,
    createdAt: s.createdAt,
  };
}

const S = ["XS", "S", "M", "L", "XL"];

export const products: Product[] = [
  // Atelier Nova
  product({
    creator: "atelier-nova", collection: "bleus-de-travail", title: "Veste Contremaître", category: "vetements", sub: "vestes",
    price: 240, edition: "unique", materials: ["Toile de coton ancienne", "Boutons corozo"], colors: [["Bleu de Chine", "#2B4A7A"]],
    sizes: ["M"], stock: [1], popularity: 940, favorites: 312, createdAt: "2026-09-03T10:00:00.000Z", worn: true,
    description: "Veste recoupée dans une bleue de travail des années 60. Épaules redessinées, poches plaquées doublées, patine d'origine conservée.",
    story: "La toile vient d'un lot de vêtements d'atelier retrouvé dans une ferme de l'Oise.",
  }),
  product({
    creator: "atelier-nova", collection: "bleus-de-travail", title: "Pantalon Atelier", category: "vetements", sub: "pantalons",
    price: 165, edition: "limited", editionSize: 12, materials: ["Drap de lin ancien", "Toile de coton"], colors: [["Écru", "#E9E1CF"]],
    sizes: ["XS", "S", "M", "L"], stock: [1, 2, 2, 0], popularity: 620, favorites: 184, createdAt: "2026-09-05T10:00:00.000Z", worn: true,
    description: "Pantalon large à pinces, taille haute. Chaque pièce est coupée dans un drap de lin différent : les nuances varient.",
  }),
  product({
    creator: "atelier-nova", title: "Chemise Blouse d'école", category: "vetements", sub: "hauts",
    price: 110, edition: "made_to_order", leadTimeDays: 14, materials: ["Coton de blouse ancienne"], colors: [["Gris ardoise", "#5B6168"]],
    sizes: S, stock: [5], popularity: 410, favorites: 96, createdAt: "2026-08-20T10:00:00.000Z", worn: true,
    description: "Chemise ample reprenant le col et les boutons de blouses d'écolier. Fabriquée à la commande en deux semaines.",
  }),
  // Maison Oblique
  product({
    creator: "maison-oblique", collection: "equilibres", title: "Tabouret Penché", category: "maison", sub: "mobilier",
    price: 290, edition: "limited", editionSize: 20, materials: ["Chêne massif du Jura", "Huile naturelle"], colors: [["Chêne naturel", "#C49A6C"]],
    stock: [6], popularity: 880, favorites: 402, createdAt: "2026-06-12T10:00:00.000Z",
    description: "Tabouret tripode dont l'assise penche de quatre degrés. Stable, étonnant, assemblé sans vis.",
  }),
  product({
    creator: "maison-oblique", collection: "equilibres", title: "Étagère Glissée", category: "maison", sub: "mobilier",
    price: 360, edition: "made_to_order", leadTimeDays: 21, materials: ["Frêne", "Laiton"], colors: [["Frêne clair", "#DCC7A1"], ["Frêne teinté noir", "#2A2622"]],
    stock: [3, 2], popularity: 520, favorites: 211, createdAt: "2026-07-01T10:00:00.000Z",
    description: "Étagère murale à trois niveaux décalés, fixations en laiton apparent.",
  }),
  product({
    creator: "maison-oblique", title: "Bougeoir Contrepoids", category: "objets", sub: "art-de-la-table",
    price: 75, edition: "ongoing", materials: ["Chêne", "Acier brut"], colors: [["Chêne et acier", "#8A7A66"]],
    stock: [14], popularity: 690, favorites: 260, createdAt: "2026-08-02T10:00:00.000Z",
    description: "Bougeoir en porte-à-faux, tenu par un contrepoids d'acier. Pour une bougie de table standard.",
  }),
  // Fil Rouge Studio
  product({
    creator: "fil-rouge-studio", collection: "stock-dormant", title: "Pull Carreaux Rouges", category: "vetements", sub: "maille",
    price: 185, edition: "limited", editionSize: 15, materials: ["Laine d'agneau recyclée", "Mohair"], colors: [["Rouge et rose", "#C8391B"]],
    sizes: ["S", "M", "L"], stock: [2, 3, 1], popularity: 1180, favorites: 488, createdAt: "2026-09-09T10:00:00.000Z", worn: true,
    description: "Pull oversize à damier irrégulier, tricoté machine puis fini à la main.",
    story: "Le fil rouge vient d'un stock dormant de 1998 retrouvé dans une filature de Tourcoing.",
  }),
  product({
    creator: "fil-rouge-studio", collection: "stock-dormant", title: "Bonnet Bord Côte", category: "accessoires", sub: "chapeaux",
    price: 48, edition: "ongoing", materials: ["Laine mérinos recyclée"], colors: [["Tomate", "#D9482B"], ["Vert bouteille", "#2F5A45"], ["Crème", "#EFE6D2"]],
    stock: [8, 5, 0], popularity: 860, favorites: 305, createdAt: "2026-09-11T10:00:00.000Z", worn: true,
    description: "Bonnet épais en côtes 2×2, revers large. Taille unique.",
  }),
  product({
    creator: "fil-rouge-studio", title: "Écharpe Rayures Franches", category: "accessoires", sub: "echarpes",
    price: 95, edition: "limited", editionSize: 25, materials: ["Laine recyclée", "Coton"], colors: [["Multicolore", "#E0A13A"]],
    stock: [9], popularity: 540, favorites: 170, createdAt: "2026-08-28T10:00:00.000Z", worn: true,
    description: "Écharpe longue à rayures asymétriques, franges nouées main.",
  }),
  // Céramiques Lune
  product({
    creator: "ceramiques-lune", collection: "calanques", title: "Bol Calanque", category: "objets", sub: "ceramique",
    price: 38, edition: "ongoing", materials: ["Grès chamotté", "Émail maison"], colors: [["Vert algue", "#5E7F6A"], ["Bleu crique", "#3E7C99"], ["Blanc calcaire", "#EEE9DF"]],
    stock: [12, 7, 4], popularity: 1320, favorites: 560, createdAt: "2026-06-22T10:00:00.000Z",
    description: "Bol tourné, pied brut, émail coulant. Passe au lave-vaisselle.",
  }),
  product({
    creator: "ceramiques-lune", collection: "calanques", title: "Tasse Écume", category: "objets", sub: "art-de-la-table",
    price: 32, edition: "ongoing", materials: ["Grès", "Émail satiné"], colors: [["Blanc écume", "#F2EFE8"], ["Bleu crique", "#3E7C99"]],
    stock: [10, 0], popularity: 980, favorites: 390, createdAt: "2026-07-04T10:00:00.000Z",
    description: "Tasse sans anse de 20 cl, façonnée pour tenir dans deux mains.",
  }),
  product({
    creator: "ceramiques-lune", title: "Grand Plat Sormiou", category: "objets", sub: "ceramique",
    price: 120, edition: "unique", materials: ["Grès", "Émail de cendre"], colors: [["Bleu profond", "#244E6B"]],
    stock: [1], popularity: 610, favorites: 240, createdAt: "2026-09-14T10:00:00.000Z",
    description: "Plat de service de 38 cm, émail de cendre de pin. Pièce unique issue d'une cuisson au bois.",
  }),
  // Soline A.
  product({
    creator: "soline-a", collection: "gouttes", title: "Bague Goutte", category: "bijoux", sub: "bagues",
    price: 145, edition: "ongoing", materials: ["Argent 925 recyclé"], colors: [["Argent", "#C9CBCC"]],
    sizes: ["50", "52", "54", "56", "58"], stock: [2, 4, 3, 1, 0], popularity: 1650, favorites: 720, createdAt: "2026-06-06T10:00:00.000Z", worn: true,
    description: "Bague sculptée à la cire perdue, surface légèrement martelée. Poinçonnée.",
  }),
  product({
    creator: "soline-a", collection: "gouttes", title: "Collier Galet", category: "bijoux", sub: "colliers",
    price: 210, edition: "limited", editionSize: 30, materials: ["Argent 925 recyclé"], colors: [["Argent", "#C9CBCC"]],
    stock: [11], popularity: 1210, favorites: 530, createdAt: "2026-06-18T10:00:00.000Z", worn: true,
    description: "Pendentif galet sur chaîne forçat de 45 cm. Numéroté au dos.",
  }),
  product({
    creator: "soline-a", title: "Créoles Reflet", category: "bijoux", sub: "boucles",
    price: 125, edition: "ongoing", materials: ["Argent 925 recyclé"], colors: [["Argent", "#C9CBCC"], ["Vermeil", "#D6B26A"]],
    stock: [6, 3], popularity: 990, favorites: 410, createdAt: "2026-07-26T10:00:00.000Z", worn: true,
    description: "Créoles irrégulières de 25 mm, fermoir clic.",
  }),
  // Kōri
  product({
    creator: "kori", collection: "noragi", title: "Veste Noragi Technique", category: "vetements", sub: "vestes",
    price: 280, edition: "limited", editionSize: 40, materials: ["Toile ripstop recyclée", "Coton bio"], colors: [["Noir encre", "#1C1C1E"], ["Kaki", "#6B6A48"]],
    sizes: S, stock: [1, 3, 4, 2, 1, 0, 2, 2, 1, 0], popularity: 1890, favorites: 802, createdAt: "2026-08-26T10:00:00.000Z", worn: true,
    description: "Veste croisée sans col, ceinture intégrée, poches cargo intérieures. Déperlante.",
  }),
  product({
    creator: "kori", collection: "noragi", title: "Pantalon Samue", category: "vetements", sub: "pantalons",
    price: 190, edition: "limited", editionSize: 40, materials: ["Twill de coton épais"], colors: [["Indigo", "#28324F"]],
    sizes: S, stock: [2, 4, 5, 3, 1], popularity: 1340, favorites: 520, createdAt: "2026-08-27T10:00:00.000Z", worn: true,
    description: "Pantalon ample à taille coulissée et bas resserré. Genoux renforcés.",
  }),
  product({
    creator: "kori", title: "T-shirt Glace", category: "vetements", sub: "hauts",
    price: 55, edition: "ongoing", materials: ["Jersey de coton bio 240 g"], colors: [["Blanc", "#F4F2EE"], ["Noir encre", "#1C1C1E"]],
    sizes: S, stock: [6], popularity: 1520, favorites: 450, createdAt: "2026-07-15T10:00:00.000Z", worn: true,
    description: "T-shirt épais coupe boxy, sérigraphie du caractère 氷 dans le dos.",
  }),
  // Cuir Brut
  product({
    creator: "cuir-brut", title: "Sac Besace Sellier", category: "maroquinerie", sub: "sacs",
    price: 340, edition: "made_to_order", leadTimeDays: 28, materials: ["Cuir de veau tannage végétal", "Fil de lin ciré"], colors: [["Naturel", "#B8865A"], ["Havane", "#6B3F22"]],
    stock: [3, 2], popularity: 1050, favorites: 470, createdAt: "2026-06-16T10:00:00.000Z", worn: true,
    description: "Besace cousue main au point sellier, bandoulière réglable. Se patine avec le temps.",
  }),
  product({
    creator: "cuir-brut", title: "Porte-cartes Chute", category: "maroquinerie", sub: "petite-maroquinerie",
    price: 45, edition: "ongoing", materials: ["Chutes de cuir tannage végétal"], colors: [["Assortiment", "#8C5A3C"]],
    stock: [20], popularity: 870, favorites: 280, createdAt: "2026-07-08T10:00:00.000Z",
    description: "Porte-cartes quatre fentes découpé dans les chutes de l'atelier. Chaque pièce a sa teinte.",
  }),
  product({
    creator: "cuir-brut", title: "Cabas Marché", category: "maroquinerie", sub: "sacs",
    price: 260, edition: "limited", editionSize: 10, materials: ["Cuir épais", "Toile de lin"], colors: [["Naturel", "#B8865A"]],
    stock: [0], popularity: 560, favorites: 230, createdAt: "2026-08-15T10:00:00.000Z", worn: true,
    description: "Grand cabas à fond cuir et corps en lin lavé. Série épuisée, réassort prévu à l'automne.",
  }),
  // Papier Grain
  product({
    creator: "papier-grain", collection: "villes-inventees", title: "Affiche Port Imaginaire", category: "art-print", sub: "affiches",
    price: 40, edition: "limited", editionSize: 50, materials: ["Papier recyclé 170 g", "Encres riso soja"], colors: [["Bleu et rose fluo", "#3D5AFE"]],
    stock: [34], popularity: 720, favorites: 290, createdAt: "2026-09-13T10:00:00.000Z",
    description: "Risographie trois couleurs, format A3. Signée et numérotée.",
  }),
  product({
    creator: "papier-grain", collection: "villes-inventees", title: "Affiche Ville Haute", category: "art-print", sub: "affiches",
    price: 40, edition: "limited", editionSize: 50, materials: ["Papier recyclé 170 g", "Encres riso soja"], colors: [["Vert et orange", "#1F8A5B"]],
    stock: [41], popularity: 480, favorites: 160, createdAt: "2026-09-15T10:00:00.000Z",
    description: "Risographie deux couleurs, format A3. Signée et numérotée.",
  }),
  product({
    creator: "papier-grain", title: "Carnet Linogravé", category: "art-print", sub: "carnets",
    price: 22, edition: "ongoing", materials: ["Papier bouffant 120 g", "Couverture linogravée"], colors: [["Kraft", "#B99467"]],
    stock: [25], popularity: 390, favorites: 110, createdAt: "2026-09-18T10:00:00.000Z",
    description: "Carnet A5 de 96 pages, couverture imprimée à la main, reliure cousue.",
  }),
  // Maison Verveine
  product({
    creator: "maison-verveine", collection: "quatorze-foulards", title: "Robe Quatorze", category: "vetements", sub: "robes",
    price: 320, edition: "unique", materials: ["Soies anciennes"], colors: [["Imprimé floral", "#B75D69"]],
    sizes: ["S"], stock: [1], popularity: 1430, favorites: 680, createdAt: "2026-07-12T10:00:00.000Z", worn: true,
    description: "Robe longue assemblée à partir de quatorze foulards de soie des années 70.",
  }),
  product({
    creator: "maison-verveine", collection: "quatorze-foulards", title: "Blouse Jardin", category: "vetements", sub: "hauts",
    price: 145, edition: "limited", editionSize: 8, materials: ["Soie ancienne", "Voile de coton"], colors: [["Vert tilleul", "#A7B46E"]],
    sizes: ["XS", "S", "M"], stock: [1, 0, 2], popularity: 760, favorites: 300, createdAt: "2026-07-18T10:00:00.000Z", worn: true,
    description: "Blouse à col lavallière, manches bouffantes, dos en voile de coton.",
  }),
  product({
    creator: "maison-verveine", title: "Foulard Recomposé", category: "accessoires", sub: "echarpes",
    price: 70, edition: "unique", materials: ["Soie ancienne"], colors: [["Bordeaux", "#6E1F2A"]],
    stock: [1], popularity: 420, favorites: 150, createdAt: "2026-09-19T10:00:00.000Z", worn: true,
    description: "Carré de 70 cm assemblé à partir de quatre foulards anciens, ourlets roulottés main.",
  }),
  // Studio Halte
  product({
    creator: "studio-halte", title: "Plaid Colombage", category: "maison", sub: "textile-maison",
    price: 230, edition: "limited", editionSize: 12, materials: ["Laine des Vosges", "Lin"], colors: [["Ocre et brun", "#B9802F"]],
    stock: [5], popularity: 640, favorites: 260, createdAt: "2026-07-22T10:00:00.000Z",
    description: "Plaid tissé à bras, motif géométrique inspiré des colombages alsaciens. 130 × 180 cm.",
  }),
  product({
    creator: "studio-halte", title: "Coussin Carrelage", category: "maison", sub: "textile-maison",
    price: 85, edition: "ongoing", materials: ["Coton", "Lin", "Garnissage kapok"], colors: [["Bleu et crème", "#3F5E8C"], ["Rouge et crème", "#A83A2A"]],
    stock: [7, 4], popularity: 450, favorites: 140, createdAt: "2026-08-05T10:00:00.000Z",
    description: "Coussin 45 × 45 cm tissé en jacquard, garnissage en kapok naturel.",
  }),
  product({
    creator: "studio-halte", title: "Tenture Krutenau", category: "maison", sub: "textile-maison",
    price: 410, edition: "unique", materials: ["Laine", "Chanvre", "Tasseau de chêne"], colors: [["Terre", "#8A5A3B"]],
    stock: [1], popularity: 380, favorites: 190, createdAt: "2026-09-17T10:00:00.000Z",
    description: "Tenture murale tissée de 80 × 120 cm, livrée avec sa baguette de suspension en chêne.",
  }),
  // ONDÈ
  product({
    creator: "ondine-rey", title: "Boucles Écume", category: "bijoux", sub: "boucles",
    price: 68, edition: "ongoing", materials: ["Laiton martelé", "Verre soufflé"], colors: [["Laiton et verre clair", "#D8C27A"]],
    stock: [9], popularity: 520, favorites: 230, createdAt: "2026-09-06T10:00:00.000Z", worn: true,
    description: "Pendants en laiton martelé et perle de verre soufflée à bulles volontaires.",
  }),
  product({
    creator: "ondine-rey", title: "Collier Marée", category: "bijoux", sub: "colliers",
    price: 92, edition: "limited", editionSize: 20, materials: ["Laiton", "Verre soufflé bleu"], colors: [["Bleu marée", "#4A8FB3"]],
    stock: [13], popularity: 330, favorites: 120, createdAt: "2026-09-21T10:00:00.000Z", worn: true,
    description: "Collier ras de cou, trois perles de verre soufflé bleu sur chaîne laiton.",
  }),
  product({
    creator: "ondine-rey", title: "Bague Bulle", category: "bijoux", sub: "bagues",
    price: 58, edition: "ongoing", materials: ["Laiton", "Verre soufflé"], colors: [["Laiton", "#D8C27A"]],
    sizes: ["52", "54", "56"], stock: [3, 4, 2], popularity: 290, favorites: 90, createdAt: "2026-09-22T10:00:00.000Z", worn: true,
    description: "Anneau ouvert réglable en laiton, surmonté d'une bulle de verre soufflé.",
  }),
  // Atelier Sable
  product({
    creator: "atelier-sable", collection: "dix", title: "Veste Dix", category: "vetements", sub: "vestes",
    price: 295, edition: "limited", editionSize: 30, materials: ["Laine froide", "Doublure cupro"], colors: [["Sable", "#CDB892"], ["Charbon", "#33312E"]],
    sizes: ["XS", "S", "M", "L"], stock: [1, 2, 2, 1, 2, 3, 2, 0], popularity: 870, favorites: 340, createdAt: "2026-08-12T10:00:00.000Z", worn: true,
    description: "Veste droite sans revers, épaules naturelles, un seul bouton caché.",
  }),
  product({
    creator: "atelier-sable", collection: "dix", title: "Pantalon Droit Lin", category: "vetements", sub: "pantalons",
    price: 175, edition: "ongoing", materials: ["Lin lourd lavé"], colors: [["Sable", "#CDB892"], ["Charbon", "#33312E"]],
    sizes: ["XS", "S", "M", "L", "XL"], stock: [3], popularity: 640, favorites: 220, createdAt: "2026-08-13T10:00:00.000Z", worn: true,
    description: "Pantalon droit taille mi-haute, poches italiennes, ourlet de 4 cm.",
  }),
  product({
    creator: "atelier-sable", collection: "dix", title: "Chemise Col Officier", category: "vetements", sub: "hauts",
    price: 130, edition: "ongoing", materials: ["Popeline de coton bio"], colors: [["Blanc cassé", "#F1ECE2"]],
    sizes: S, stock: [4, 5, 5, 3, 2], popularity: 510, favorites: 170, createdAt: "2026-08-14T10:00:00.000Z", worn: true,
    description: "Chemise à col officier et patte boutonnée cachée. Coupe légèrement ample.",
  }),
];
