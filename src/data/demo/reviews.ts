import type { Review } from "@/types/domain";
import { products } from "./products";

type Spec = [productTitleStart: string, author: string, rating: Review["rating"], body: string, date: string, verified?: boolean];

const specs: Spec[] = [
  ["Veste Contremaître", "Camille R.", 5, "La coupe est incroyable, on sent que chaque couture a été pensée. Maëlle m'a envoyé une petite note sur l'histoire de la toile.", "2026-09-12"],
  ["Pantalon Atelier", "Julien M.", 4, "Très beau lin, un peu long pour moi mais l'ourlet se refait facilement.", "2026-09-15"],
  ["Tabouret Penché", "Sarah L.", 5, "Tout le monde s'assoit dessus en se demandant s'il va tenir. Il tient parfaitement.", "2026-07-20"],
  ["Bougeoir Contrepoids", "Nadia K.", 5, "Objet superbe, emballage soigné, livré en trois jours.", "2026-08-19"],
  ["Pull Carreaux Rouges", "Léa P.", 5, "Chaud, lourd juste ce qu'il faut, et les couleurs sont encore plus belles en vrai.", "2026-09-18"],
  ["Bonnet Bord Côte", "Tom B.", 4, "Bonnet très épais. La couleur tomate est un peu plus orangée que sur la photo.", "2026-09-20"],
  ["Bol Calanque", "Hélène D.", 5, "J'en ai commandé quatre, aucun n'est identique et c'est exactement ce que je voulais.", "2026-07-10"],
  ["Bol Calanque", "Marc V.", 3, "Joli bol mais un petit éclat sous le pied à la réception. Jade m'a proposé un échange immédiatement.", "2026-08-02"],
  ["Tasse Écume", "Inès G.", 5, "Elle tient dans les mains comme un galet chaud. Parfait pour le thé.", "2026-08-11"],
  ["Bague Goutte", "Émilie F.", 5, "Magnifique, légère, je ne l'enlève plus.", "2026-07-02"],
  ["Collier Galet", "Anaïs T.", 5, "Numéroté au dos, livré dans une boîte en carton recyclé avec un mot manuscrit.", "2026-07-15"],
  ["Veste Noragi Technique", "Mehdi A.", 5, "Coupe ample, poches intérieures parfaites pour le vélo. Déjà trempée deux fois, rien n'est passé.", "2026-09-10"],
  ["Pantalon Samue", "Lucas N.", 4, "Super confortable. Taille un peu grand, prendre une taille en dessous.", "2026-09-14"],
  ["T-shirt Glace", "Chloé W.", 5, "Coton épais, la sérigraphie ne bouge pas au lavage.", "2026-08-01"],
  ["Sac Besace Sellier", "Paul E.", 5, "Coutures impeccables. Un sac pour la vie.", "2026-07-25"],
  ["Porte-cartes Chute", "Zoé H.", 4, "Petit, solide, j'ai reçu une teinte miel très jolie.", "2026-08-03"],
  ["Robe Quatorze", "Margaux C.", 5, "Portée pour le mariage de ma sœur. On m'a demandé d'où elle venait toute la soirée.", "2026-08-22"],
  ["Plaid Colombage", "Victor S.", 5, "Épais et chaud, le motif est encore plus beau en vrai.", "2026-08-30"],
  ["Veste Dix", "Alice M.", 4, "Très belle laine, coupe nette. Délai un peu long mais prévenu à l'avance.", "2026-09-01"],
  ["Affiche Port Imaginaire", "Romain J.", 5, "Les couleurs riso sont vibrantes, papier épais. Encadrée tout de suite.", "2026-09-19"],
  ["Boucles Écume", "Sofia B.", 5, "Légères et lumineuses, on voit vraiment les bulles dans le verre.", "2026-09-17", false],
];

export const reviews: Review[] = specs.map(([titleStart, authorName, rating, body, date, verified = true], i) => {
  const p = products.find((x) => x.title.startsWith(titleStart));
  if (!p) throw new Error(`Produit de démo introuvable : ${titleStart}`);
  return {
    id: `rev-${i + 1}`,
    productId: p.id,
    creatorId: p.creatorId,
    authorId: `usr-buyer-${i + 1}`,
    authorName,
    rating,
    body,
    verifiedPurchase: verified,
    status: "visible",
    createdAt: `${date}T12:00:00.000Z`,
  };
});
