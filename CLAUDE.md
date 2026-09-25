@AGENTS.md

# Signé — conventions du projet

- Lire `docs/01-architecture.md` avant toute modification.
- Les pages n'importent jamais `src/data` : passer par `src/services`.
- Les permissions se vérifient côté serveur avec `src/lib/auth/permissions.ts`.
- Montants en centimes. Commission visible uniquement côté vendeur, admin et finance.
- Interface en français. Pas de mention « démo » ou « prototype » dans l'interface publique.
- Avant de pousser : `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Pilotage Notion : règle permanente

Chaque sprint suit le cycle : code, tests, audit, mise à jour de Notion, compte rendu, sprint suivant.
Avant de terminer une session importante, appliquer la checklist de `docs/02-pilotage-notion.md`.

- Le dépôt est la source de vérité de ce qui est implémenté. Notion l'est pour la roadmap, les décisions, les priorités, les risques et les idées.
- Toujours distinguer dans Notion : « Prévu », « Existe dans le code », « Fonctionne en démo », « Prêt pour production ».
- Ne jamais modifier silencieusement une décision : passer l'ancienne en « Remplacée », en créer une nouvelle, le signaler.
- Page d'entrée Notion : SIGNÉ — Cockpit (liens dans `docs/02-pilotage-notion.md`).
