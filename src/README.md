# Tetris React + Vite (Móvil y Desktop)

Juego tipo Tetris con controles táctiles y UI moderna, construido con React + Vite.

## Requisitos
- Node.js 18+ (recomendado 20)

## Desarrollo local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy en GitHub Pages (método recomendado: GitHub Actions)
- Ajusta `base` en `vite.config.js` a `"/NOMBRE_DEL_REPO/"`.
- Haz git push a `main` con el workflow de Actions (si no lo tienes, usa `.github/workflows/deploy.yml` incluido).

## Deploy con gh-pages (alternativo)
```bash
npm run build
npm run deploy
```
Luego configura **Settings → Pages**: Branch `gh-pages`, folder `/ (root)`.
