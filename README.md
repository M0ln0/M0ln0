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

## État

| Sprint | Contenu | État |
| --- | --- | --- |
| 0 | Audit | Fait |
| 1 | Architecture, design system, données, pages de découverte | Fait |
| 2 | Authentification, rôles, favoris, suivis | À venir |
| 3 | Catalogue en base, médias réels | À venir |
| 4 | Panier multi-créateurs, commandes, stock | À venir |
| 5 | Paiement, remboursements, livraison | À venir |
| 6 | Espace créateur | À venir |
| 7 | Administration | À venir |
| 8 | Support, litiges, modération | À venir |
| 9 | Analytics, acquisition | À venir |
| 10 | Sécurité, performance, tests de bout en bout | À venir |
