@AGENTS.md

# Signé — conventions du projet

- Lire `docs/01-architecture.md` avant toute modification.
- Les pages n'importent jamais `src/data` : passer par `src/services`.
- Les permissions se vérifient côté serveur avec `src/lib/auth/permissions.ts`.
- Montants en centimes. Commission visible uniquement côté vendeur, admin et finance.
- Interface en français. Pas de mention « démo » ou « prototype » dans l'interface publique.
- Avant de pousser : `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
