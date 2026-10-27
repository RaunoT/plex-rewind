# Plex Rewind

Self-hosted Next.js 16 app (App Router, React 19, Tailwind 4, TypeScript) that shows Plex statistics from Tautulli or Tracearr. It ships as a Docker image (`ghcr.io/raunot/plex-rewind`, `raunoot/plex-rewind`) that listens on port 8383.

Contributor setup is in [CONTRIBUTING.md](CONTRIBUTING.md). Use pnpm (pinned in `package.json`) and Node 24.

## Commands

- `pnpm dev`: dev server with Turbopack at `http://localhost:3000`. Needs `.env.local`, copied from `.env.example`.
- `pnpm lint:all`: ESLint, `tsc --noEmit`, Stylelint and a Prettier check. Run it and `pnpm test` before every PR. `pnpm lint:all:fix` fixes what it can.
- `pnpm build`: `next build` followed by `serwist build`, which generates the service worker in `public/sw.js`.
- `pnpm commit`: guided Conventional Commits prompt (commitizen).
- `pnpm test`: Vitest unit tests, kept next to the code they test as `*.test.ts`.

## Branches and commits

- Open PRs against `develop`, never `main`.
- Commits and PR titles follow Conventional Commits: `type(scope): description`. Types are enforced by `commitlint.config.ts`: `feat`, `fix`, `ui` (custom, for UI changes), `perf`, `docs`, `revert`, `chore`, `refactor`, `build`, `ci`, `style`, `test`.
- Branch names follow `type(scope)/short-description`, for example `feat(dashboard)/new-widget` or `fix/null-pointer`.
- Releases are automated by semantic-release: pre-releases from `develop`, releases from `main`, with a backmerge from `main` to `develop`. `feat` bumps minor; `fix`, `ui`, `perf`, `build`, `ci`, `revert` and `refactor` bump patch; `docs`, `chore`, `style` and `test` do not release. Never edit versions or changelogs by hand.
- Husky runs lint-staged on commit and commitlint on the message. Do not skip the hooks.

## Architecture

- `src/app`: routes (`dashboard`, `rewind`, `activity`, `settings`, `api`). Components and server actions sit next to their route in `_components` and `_actions`.
- `src/proxy.ts`: the Next 16 proxy (formerly middleware), wrapped in next-auth's `withAuth`. It redirects to the setup pages while required settings are missing.
- Settings live in `config/settings.json`, read and written by `src/utils/getSettings.ts`. The file is created from `DEFAULT_SETTINGS` in `src/utils/constants.ts` and merged with it when read. Types are in `src/types/settings.d.ts`. In Docker the `config` directory is a volume at `/app/config`.
- Statistics source: `settings.connection.statisticsSource` is `tautulli` or `tracearr`. Both implement the `StatsSource` interface in `src/types/statsSource.d.ts`: Tautulli in `tautulliSource.ts` (HTTP client `fetchTautulli.ts`), Tracearr in `tracearrSource.ts` (HTTP client `fetchTracearr.ts`), which maps Tracearr data onto the Tautulli types in `src/types`. `getStatsSource()` in `src/utils/statsSource.ts` picks one; the data utils and pages call it instead of branching on the source. A new statistic goes into the interface and both implementations.
- Other data utils: `getDashboard.ts`, `getRewind.ts`, `getUsersTop.ts`, `fetchOverseerr.ts`, `fetchTmdb.ts`. Login uses Plex through next-auth (`src/lib/auth.ts`).
- Translations: `messages/*.json` (`en`, `et`, `fr`, `de`, `it`, `es`), loaded by `src/i18n/request.ts`. The locale list is `LOCALES` in `src/utils/constants.ts`. Every key must exist in all locales, and `react/jsx-no-literals` flags hardcoded strings in JSX, so use next-intl.
- PWA: the service worker source is `src/lib/sw.ts`; `public/manifest.json` is the web manifest. `next.config.ts` uses `output: 'standalone'`, which the `Dockerfile` relies on.
- `docker-compose.yml` is for local development: it builds the image, maps `3000:8383` and reads `.env.local`.

## Code style

Prettier (no semicolons, single quotes) and ESLint decide formatting; ESLint also requires blank lines around `return`, `if` and variable declarations. CSS classes are kebab-case. Run `pnpm lint:all:fix` instead of formatting by hand.

## Rules

- Never commit secrets: `.env*.local`, `config/settings.json`, API keys, tokens or `NEXTAUTH_SECRET`. Do not paste them into issues, logs or PR text either.
- Do not add AI attribution to commits or PRs: no `Co-Authored-By` trailers and no "generated with" lines.
- Keep commit messages, PR descriptions and docs plain and concise.
- Do not hand-edit `pnpm-lock.yaml`.
