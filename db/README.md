# Base de données

Schéma PostgreSQL de Signé, compatible Supabase.

| Fichier | Rôle |
| --- | --- |
| `migrations/0001_initial_schema.sql` | Tables, contraintes, index, fonctions de stock, Row Level Security |
| `test/supabase-shim.sql` | Reproduit `auth.uid()` et les rôles Supabase sur un PostgreSQL nu |
| `test/schema-checks.sql` | Vérifications : stock, audit, RLS, recherche |

## Vérifier le schéma en local

```bash
createdb signe_test
psql -d signe_test -f db/test/supabase-shim.sql
psql -d signe_test -f db/migrations/0001_initial_schema.sql
psql -d signe_test -f db/test/schema-checks.sql
```

La dernière commande affiche « Toutes les vérifications du schéma sont passées. ».
Elle s'exécute dans une transaction annulée : aucune donnée ne reste.

## Ce que le schéma garantit

- **Rôles admin isolés.** Les rôles d'administration vivent dans `admin_members`, sans aucune policy client. Un utilisateur connecté ne peut ni les lire ni en créer.
- **Profil verrouillé.** Un utilisateur ne peut modifier ni son statut, ni son type de compte.
- **Dernier exemplaire.** `reserve_variant` verrouille la variante avant de réserver. Deux paiements simultanés sur la dernière pièce : le second échoue. Une réservation expirée libère le stock.
- **Audit en ajout seul.** Toute modification ou suppression dans `admin_logs` est refusée.
- **Commission invisible pour l'acheteur.** La commission vit dans `seller_order_fees`, lisible par le créateur concerné et par le serveur uniquement. Elle est séparée de `seller_orders` car la RLS filtre des lignes, pas des colonnes.
- **Idempotence.** `orders.idempotency_key`, `refunds.idempotency_key` et la clé primaire de `webhook_events` empêchent les doubles traitements.
- **Notes internes.** Un client ne lit que les messages `internal = false` de ses propres tickets.
