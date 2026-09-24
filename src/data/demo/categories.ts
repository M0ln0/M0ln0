import type { Category } from "@/types/domain";

export const categories: Category[] = [
  {
    slug: "vetements",
    label: "Vêtements",
    subcategories: [
      { slug: "vestes", label: "Vestes et manteaux" },
      { slug: "hauts", label: "Hauts et chemises" },
      { slug: "maille", label: "Maille" },
      { slug: "robes", label: "Robes" },
      { slug: "pantalons", label: "Pantalons et jupes" },
    ],
  },
  {
    slug: "accessoires",
    label: "Accessoires",
    subcategories: [
      { slug: "chapeaux", label: "Bonnets et chapeaux" },
      { slug: "echarpes", label: "Écharpes et foulards" },
    ],
  },
  {
    slug: "bijoux",
    label: "Bijoux",
    subcategories: [
      { slug: "bagues", label: "Bagues" },
      { slug: "colliers", label: "Colliers" },
      { slug: "boucles", label: "Boucles d'oreilles" },
    ],
  },
  {
    slug: "maroquinerie",
    label: "Maroquinerie",
    subcategories: [
      { slug: "sacs", label: "Sacs" },
      { slug: "petite-maroquinerie", label: "Petite maroquinerie" },
    ],
  },
  {
    slug: "objets",
    label: "Objets",
    subcategories: [
      { slug: "ceramique", label: "Céramique" },
      { slug: "art-de-la-table", label: "Art de la table" },
    ],
  },
  {
    slug: "maison",
    label: "Maison",
    subcategories: [
      { slug: "mobilier", label: "Mobilier" },
      { slug: "textile-maison", label: "Textile de maison" },
    ],
  },
  {
    slug: "art-print",
    label: "Art imprimé",
    subcategories: [
      { slug: "affiches", label: "Affiches" },
      { slug: "carnets", label: "Carnets" },
    ],
  },
];
