# Signé

Marketplace de créateurs indépendants : mode, design et objets.
Découvrir les futurs créateurs avant qu'ils deviennent connus.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

## Vérifier

```bash
npm test           # tests unitaires (permissions, recherche, tarification, dépôts)
npm run typecheck
npm run lint
npm run build
```

Le schéma PostgreSQL se vérifie séparément, voir `db/README.md`.

## Documentation

- `docs/00-audit-sprint-0.md` : audit initial, plan par sprint, priorités.
- `docs/01-architecture.md` : architecture, règles, passage à PostgreSQL.
- `db/README.md` : schéma, garanties de sécurité.
- `docs/02-pilotage-notion.md` : pilotage du projet dans Notion.

## État

Le suivi détaillé vit dans Notion : voir `docs/02-pilotage-notion.md`.
Découpage des sprints appliqué provisoirement le 25/09/2026, en attente de validation dans le Decision Log.

| Sprint | Contenu | État |
| --- | --- | --- |
| 0 | Audit + fondations | Fait |
| 1 | Catalogue, recherche, architecture initiale, design system | Fait |
| 2 | Authentification, rôles, favoris, suivi des créateurs | Prochain |
| 3 | Profils utilisateurs, comptes créateurs, catalogue en base, médias | À venir |
| 4 | Panier, commandes, stock, logique marketplace | À venir |
| 5 | Paiement marketplace | À venir |
| 6 | Livraison, retours, remboursements, litiges | À venir |
| 7 | Administration opérationnelle | À venir |
| 8 | Support, tickets, modération, sanctions, résolution | À venir |
| 9 | Analytics, acquisition, écoles, croissance | À venir |
| 10 | Professionnels et évolution B2B | À venir |

Sans sprint attribué à ce jour : espace créateur complet, durcissement sécurité et performance, tests de bout en bout.
