---
name: git-deployment-pipeline
description: Flujo git conventional commits y deploy estático a GitHub Pages Netlify o Vercel para mindArcade.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: gitops
  scope: mindArcade
---

# Git Deployment Pipeline

## Ramas
`main` (prod) <- `dev` <- `feat/*`. Merge a main = deploy.

## Commits convencionales
`feat(quiz): añade timer`, `fix(srs): corrige intervalo`, `docs:`, `style:`, `refactor:`, `test:`.

## Pipeline estático
```bash
npm run build   # vite o esbuild -> dist/
npm test && npm run lint
# Vercel/Netlify: publish dist/, o Pages:
git subtree push --prefix dist origin gh-pages
```

## Reglas
1. No commitear `dist/`, `.env`, historial local.
2. PR pequeño (<300 líneas), con test pasando.
3. `main` siempre jugable: build verde antes de merge.
4. Version tag `v0.x` por cada set de juegos.
5. Rollback = revert commit, no force-push a main.

## Cuándo usar
Al hacer commit, release o configurar hosting.
