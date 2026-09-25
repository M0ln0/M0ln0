# Pilotage du projet dans Notion

Mis en place le 25/09/2026.

## Rôle de chaque outil

| Source de vérité | Pour |
| --- | --- |
| Le dépôt Git | Ce qui est réellement implémenté |
| Notion | Roadmap, décisions, priorités, risques, idées, vision, suivi |

Quand les deux divergent sur ce qui existe, le dépôt a raison et Notion est corrigé.

## Espace Notion

Page d'entrée : **SIGNÉ — Cockpit**.

- Cockpit : https://app.notion.com/p/3e6dffaf63ae81d19c21f302b321ce45
- Bases de données : https://app.notion.com/p/3e6dffaf63ae815ba681e4958f9b27e3
- Documentation : https://app.notion.com/p/3e6dffaf63ae81c5a115ce05bdd5462f

| Base | Contenu |
| --- | --- |
| Feature Registry | Une ligne par fonctionnalité, avec statut et maturité |
| Roadmap Signé | Initiatives de haut niveau |
| Sprints Signé | Objectif, livrables, tests et résultats de chaque sprint |
| Decision Log | Toutes les décisions, prises ou à prendre |
| Bugs & Issues | Bugs, blocages, problèmes latents |
| Risks & Technical Debt | Risques, hypothèses, dette technique |
| Ideas & Future | Idées non validées |
| Personas, User Journeys | Publics et parcours |
| Development Log | Une ligne par session de travail |
| Product Changelog | Une ligne par version |
| Growth & Schools, Editorial | Acquisition et contenus |

## Maturité d'une fonctionnalité

| Maturité | Définition |
| --- | --- |
| Prévu | Absent du code |
| En cours de développement | Du code existe, non terminé |
| Existe dans le code | Terminé et testé, non branché à l'application ou non utilisé en conditions réelles |
| Fonctionne en démo | Utilisable dans l'application sur données fictives |
| Prêt pour production | Données réelles, sécurisé, testé, déployable, avec preuve |

## Cycle de chaque sprint

Code, tests, audit, mise à jour de Notion, compte rendu, puis sprint suivant.

## Checklist de fin de session

1. Vérifier les changements réalisés dans le dépôt.
2. Créer ou mettre à jour les fonctionnalités : statut et maturité.
3. Créer les bugs découverts.
4. Clôturer les bugs résolus, avec leur vérification.
5. Ajouter les décisions importantes.
6. Mettre à jour les risques.
7. Mettre à jour la documentation technique concernée.
8. Mettre à jour le sprint : statut, livrables, tests, résultats.
9. Ajouter une ligne au Development Log, et au Product Changelog si une version sort.
10. Réécrire la page « État actuel de Signé » et noter la prochaine étape.

## Règles

- « Prévu » n'est jamais « Terminé ». « Fonctionne en démo » n'est jamais « Prêt pour production ».
- Une information inconnue s'écrit « À définir » ou « Non documenté ».
- Une décision n'est jamais modifiée silencieusement. L'ancienne passe en « Remplacée », la nouvelle est créée, et le changement est signalé dans le compte rendu.
- Toute évolution qui remet en cause l'architecture, la roadmap ou le modèle économique crée une entrée dans le Decision Log.
