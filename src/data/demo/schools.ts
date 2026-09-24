import type { School } from "@/types/domain";
import { media } from "./builders";

/** Écoles fictives. Les partenariats réels remplaceront ces fiches. */
export const schools: School[] = [
  {
    id: "sch-varenne",
    slug: "institut-varenne",
    name: "Institut Varenne",
    shortName: "Varenne",
    city: "Paris",
    kind: "mode",
    description:
      "École de mode et de stylisme. Les étudiants y développent une première collection dès la deuxième année, entre coupe, moulage et direction artistique.",
    cover: media("school-varenne", "Atelier de moulage de l'Institut Varenne", "cover"),
    partner: true,
  },
  {
    id: "sch-rhone",
    slug: "ecole-rhone-design",
    name: "École Rhône Design",
    shortName: "Rhône Design",
    city: "Lyon",
    kind: "design",
    description:
      "Design d'objet et de mobilier. Une pédagogie tournée vers les matériaux, l'atelier bois et la petite série.",
    cover: media("school-rhone", "Atelier bois de l'École Rhône Design", "cover"),
    partner: true,
  },
  {
    id: "sch-filature",
    slug: "la-filature",
    name: "La Filature — École du textile",
    shortName: "La Filature",
    city: "Roubaix",
    kind: "mode",
    description:
      "Installée dans une ancienne usine textile, l'école forme au tricot, au tissage et à la maille expérimentale.",
    cover: media("school-filature", "Métiers à tisser de La Filature", "cover"),
    partner: true,
  },
  {
    id: "sch-vieux-port",
    slug: "atelier-ecole-vieux-port",
    name: "Atelier-École du Vieux-Port",
    shortName: "Vieux-Port",
    city: "Marseille",
    kind: "arts_appliques",
    description:
      "Arts appliqués et métiers d'art : céramique, bijou, verre. Chaque promotion expose en fin d'année dans le quartier du Panier.",
    cover: media("school-vieux-port", "Tours de potier de l'Atelier-École du Vieux-Port", "cover"),
    partner: false,
  },
  {
    id: "sch-garonne",
    slug: "beaux-arts-garonne",
    name: "Beaux-Arts de la Garonne",
    shortName: "Beaux-Arts Garonne",
    city: "Toulouse",
    kind: "beaux_arts",
    description:
      "Art contemporain, gravure et image imprimée. Une école où l'on dessine autant qu'on fabrique.",
    cover: media("school-garonne", "Presse de gravure des Beaux-Arts de la Garonne", "cover"),
    partner: false,
  },
];
