# Architecture de Signé

## Vue d'ensemble

```
Navigateur ──► Pages serveur (src/app) ──► Façade serveur (src/services/*.ts, server-only)
                                               │
                                               ├─► Dépôts (src/services/repositories)
                                               │      ├─ demo      → src/data/demo (aujourd'hui)
                                               │      └─ postgres  → Supabase (Sprint 3)
                                               │
                                               └─► Permissions (src/lib/auth/permissions.ts)
```

Next.js 16, App Router, React Server Components.
Les pages lisent les données sur le serveur. Aucune donnée ni règle d'accès n'est décidée dans le navigateur.

## Arborescence

| Dossier | Contenu |
| --- | --- |
| `src/app` | Routes (l'équivalent de `/pages`). Une page = un fichier `page.tsx`. |
| `src/components/ui` | Design system : primitives, médias, visuels génératifs. |
| `src/components/layout` | En-tête, pied de page. |
| `src/features/marketplace` | Cartes produit, grille, filtres de recherche. |
| `src/features/creators` | Cartes et rangées créateurs. |
| `src/features/community` | Partage. Favoris et suivis au Sprint 2. |
| `src/features/creator-space` | Espace créateur. Simulateur de revenus aujourd'hui, dashboard au Sprint 6. |
| `src/features/admin` | Centre de contrôle, Sprint 7. |
| `src/features/business` | Espace professionnel, phase ultérieure. |
| `src/services` | Façades serveur et dépôts. Seul point d'accès aux données. |
| `src/lib` | Logique pure et testée : permissions, recherche, tarification, formatage. |
| `src/types` | Modèle de domaine partagé. |
| `src/config` | Paramètres métier : offres vendeurs, frais. |
| `src/data/demo` | Données de démonstration. Jamais importées par l'interface. |
| `db` | Schéma PostgreSQL, policies RLS, tests SQL. |
| `docs` | Audit, architecture, décisions. |

## Règles

1. **Une page n'importe jamais `src/data`.** Elle passe par `src/services`.
2. **`src/services/*.ts` importe `server-only`.** Le bundle client ne peut pas contenir d'accès aux données.
3. **Les permissions se vérifient côté serveur**, avec `can()` / `assertCan()` de `src/lib/auth/permissions.ts`. Le client peut s'en servir pour masquer un bouton, jamais pour autoriser.
4. **Le rôle administrateur n'existe pas dans le profil.** Il vit dans `admin_members`, écrit uniquement par un super admin via le serveur.
5. **Les montants sont en centimes.**
6. **La commission n'apparaît que** dans `src/config/fees.ts`, l'espace vendeur, le simulateur « Devenir créateur », l'administration et la finance.
7. **Pas de « démo » ni de « prototype » dans l'interface.** Le mode de données se lit dans `SIGNE_DATA_SOURCE`.

## Passer des données de démonstration à PostgreSQL

1. Appliquer `db/migrations` sur un projet Supabase.
2. Écrire `src/services/repositories/postgres/catalog.ts` qui implémente `CatalogRepository`.
3. L'enregistrer dans `src/services/repositories/index.ts`.
4. Passer `SIGNE_DATA_SOURCE=postgres`.
5. Rejouer les tests de `src/services/repositories/demo/catalog.test.ts` contre la nouvelle implémentation : ils décrivent le comportement attendu.

La recherche en mémoire (`src/lib/search`) devient une requête SQL : `tsvector` + `unaccent` pour le texte, index sur prix, catégorie, créateur.

## Médias

Chaque image est un objet `Media`. Sans `src`, l'interface affiche un visuel génératif : silhouette de l'objet, teintée de sa vraie couleur.
Remplacer par une photo réelle revient à renseigner `src`.

Pipeline cible (Sprint 3) :

- upload direct navigateur → Supabase Storage via URL signée ;
- validation type et poids côté serveur ;
- compression et formats AVIF/WebP par `next/image` ;
- ordre et photo principale en base (`product_media.position`, index unique sur `kind = 'main'`) ;
- modération avant publication.

## Paiement (Sprint 5)

Interface `PaymentProvider` avec deux implémentations : `simulated` et `stripe` (Stripe Connect, comptes Express).
Webhooks enregistrés dans `webhook_events` avant traitement : un événement rejoué est ignoré.
Chaque création de commande et chaque remboursement porte une clé d'idempotence.

## Stock

- Stock par variante (`product_variants.stock`).
- Réservation temporaire pendant le paiement (`reserve_variant`, 15 minutes).
- Conversion à la confirmation du paiement (`convert_reservation`).
- Le dernier exemplaire ne peut être réservé qu'une fois : la variante est verrouillée pendant la vérification.

## Sécurité

- En-têtes HTTP : `nosniff`, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy`, `Permissions-Policy`.
- CSP avec nonce au Sprint 10.
- RLS sur toutes les tables. Les tables sensibles n'ont aucune policy client.
- Journal d'audit en ajout seul.
- Double authentification obligatoire pour toute permission d'administration.

## RGPD

- Moindre privilège : l'analyste ne voit que des agrégats, le support voit les coordonnées, la modération non.
- Toute consultation de coordonnées par un admin sera journalisée (`user.view_contact`).
- Adresses IP tronquées dans l'historique de connexion.
- Anonymisation de compte : `profiles.anonymized_at`, commandes conservées pour la comptabilité sans données personnelles.
