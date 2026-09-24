# Sprint 0 — Audit du projet Signé

Date : 24/09/2026

## Constat principal

Le dépôt `M0ln0/M0ln0` ne contenait **aucun fichier et aucun commit** au moment de l'audit.
Aucune branche distante, aucun historique, aucun prototype.
Nous avons aussi cherché un prototype dans les artifacts claude.ai et dans l'espace Notion connecté : rien de trouvé.

Conséquence : il n'y avait **rien à casser et rien à migrer**.
Le prototype évoqué dans le brief (données fictives, état local, back-office basique) vit ailleurs.
S'il existe, il suffit de l'ajouter au dépôt : l'architecture ci-dessous est conçue pour absorber sa logique utile.

Le dépôt porte le nom du compte GitHub (`M0ln0/M0ln0`).
GitHub affiche le `README.md` de ce type de dépôt sur la page de profil.
Un dépôt dédié (`signe` par exemple) sera plus adapté à terme.

---

## A. Architecture actuelle

Aucune. Dépôt vide.

## B. Fonctionnalités existantes

Aucune.

## C. Fonctionnalités simulées

Aucune.

## D. Problèmes techniques

Pas de code, donc pas de dette. Les risques portent sur la suite :

- repartir sur un prototype « tout en état local » rendrait la migration vers une vraie base douloureuse ;
- mélanger données fictives et composants rendrait les données impossibles à remplacer ;
- coder les permissions dans les composants React créerait des failles.

## E. Problèmes UX

Rien à auditer. Risques identifiés pour la suite :

- dériver vers une esthétique « petites annonces » (grilles denses, prix en gros, pas de visages) ;
- montrer la commission côté acheteur ;
- afficher des mentions « démo » / « prototype » dans l'interface publique ;
- utiliser des placeholders gris qui tuent l'envie d'acheter.

## F. Problèmes sécurité

Rien à auditer. Principes posés dès le Sprint 1 :

- aucune permission décidée côté client ;
- rôle administrateur jamais attribuable depuis le frontend ;
- données fictives accessibles uniquement via une couche d'accès serveur (`server-only`) ;
- base de données avec Row Level Security activée sur toutes les tables.

---

## G. Architecture cible

Voir `docs/01-architecture.md`.

Résumé :

| Couche | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Langage | TypeScript strict |
| Style | Tailwind CSS 4 + tokens de design |
| Données | Couche d'accès serveur, interface de dépôt, implémentation « démo » remplaçable |
| Base de données cible | PostgreSQL via Supabase (auth, stockage médias, RLS) |
| Paiement cible | Stripe Connect derrière une interface de fournisseur |
| Tests | Vitest (logique métier, permissions) puis Playwright (parcours) |

## H. Plan de développement par sprint

| Sprint | Contenu | Livrable vérifiable |
| --- | --- | --- |
| 0 | Audit | Ce document |
| 1 | Architecture, design system, couche de données, pages publiques de découverte | Site navigable, tests des permissions et de la recherche |
| 2 | Authentification Supabase, sessions, rôles, favoris, suivis | Inscription, connexion, suivre un créateur, garde serveur sur `/admin` |
| 3 | Produits, créateurs, boutiques, recherche en base, médias réels | Catalogue servi par PostgreSQL, upload d'images |
| 4 | Panier multi-créateurs, commandes, stock par variante, réservation | Commande multi-vendeurs de bout en bout |
| 5 | Paiement Stripe Connect, remboursements, livraison, webhooks idempotents | Paiement test, remboursement, suivi colis |
| 6 | Espace créateur | Dashboard, produits, stocks, commandes, expéditions, revenus |
| 7 | Administration : centre de contrôle, rôles admin, 2FA, audit | Dashboard santé, fiche utilisateur, journal d'audit |
| 8 | Support, tickets, litiges, modération, sanctions, appels | Centre de résolution |
| 9 | Analytics et acquisition | Attribution écoles, créateurs, réseaux |
| 10 | Sécurité, performance, responsive, tests de bout en bout | Revue sécurité, budgets de performance |

## I. Priorités

**P0 — sans cela, pas de marketplace**

- Couche d'accès aux données côté serveur et modèle de données complet.
- Permissions serveur et rôles administrateurs.
- Authentification, vérification email, sessions.
- Catalogue, profils créateurs, recherche.
- Panier multi-créateurs, commande, stock par variante, réservation de stock.
- Paiement marketplace, reversements, remboursements.
- Journal d'audit des actions sensibles.
- Modération des créateurs et produits avant publication.

**P1 — la confiance et la gestion**

- Espace créateur complet.
- Tickets, litiges, centre de résolution, sanctions.
- Fiche utilisateur admin et timeline.
- Notifications admin, recherche admin globale.
- Vraies photos et pipeline média.
- Partage social, favoris, suivis, fil des nouveautés.

**P2 — la croissance**

- Espace professionnel (friperies, concept stores).
- Analytics d'acquisition détaillées.
- Exports CSV/Excel avancés.
- Connexion Google et Apple.
- Transporteurs et étiquettes intégrés.
- Plusieurs niveaux d'abonnement.
