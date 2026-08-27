# AGENTS.md

Personal CV / portfolio site built with Astro + Tailwind, deployed to GitHub Pages.

## Project conventions

- The three locales are French at `/`, English at `/en/`, and right-to-left Arabic at `/ar/`. Declare locales in `src/i18n/locales.ts`; locale-aware pages live under `src/pages/[...locale]/`.
- Keep language-neutral CV data in `src/data/cv.ts` and localized UI messages and CV copy in the complete layers `src/i18n/{fr,en,ar}.ts`. TypeScript enforces the layer shape: a missing key, including an English key, must fail `astro check` and the build.
- Fonts are generated dependencies, not repository assets. `scripts/download-fonts.mjs` provisions and SHA-256-verifies the pinned Noto Sans Arabic latin/Arabic subsets and Noto Sans Mono latin subset in `public/fonts/`; never commit those `.woff2` files.
- `npm run build` runs `astro check`, builds the site, and creates `dist/cv/CV.pdf`, `dist/cv/CV-en.pdf`, and `dist/cv/CV-ar.pdf`. `npm test` first creates the two pagination-stress artifacts `tmp/pagination-test/CV.pdf` and `tmp/pagination-test/CV-ar.pdf`, then runs the test suite. A human must visually review `CV-ar.pdf` after any font or line-height change because text-layer tests cannot detect clipped glyph ink.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `mohsanaziz/mohsanaziz.github.io`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` at the repo root, ADRs in `docs/adr/` (both created lazily). See `docs/agents/domain.md`.
