# Contributing to Plex Rewind

Any contributions are welcome and greatly appreciated!

Please follow the guidelines below.

## Development

### Tools

- [Git](https://git-scm.com) for source control
- [NodeJS](https://nodejs.org) (24.x or higher, see `.node-version`)
- [VSCode](https://code.visualstudio.com) is highly recommended as an editor

  > Upon opening the project, a few extensions will be automatically recommended for install. These are highly recommended to install and will make development easier. You can find the list in `.vscode/extensions.json`.

- [pnpm](https://pnpm.io) as a package manager. The version is pinned in `package.json`, so enabling it with `corepack enable pnpm` picks the right one.
- A [Plex](https://plex.tv) server and either a [Tautulli](https://tautulli.com) or a [Tracearr](https://github.com/connorgallopo/Tracearr) instance, if you want to work with real data. [Seerr](https://seerr.dev) is optional. You enter their URLs and API keys under _Settings → Connection_ once the app is running.

### Getting Started

1. [Fork](https://help.github.com/articles/fork-a-repo/) the repository to your own GitHub account and [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device:

   ```bash
   git clone https://github.com/YOUR_USERNAME/plex-rewind.git
   cd plex-rewind
   ```

2. Create `.env.local` file in the root of the project from the `.env.example` file:

   ```bash
   cp .env.example .env.local
   ```

3. Install the project dependencies:

   ```bash
   pnpm i
   ```

4. Create a new branch:

   ```bash
   git checkout -b <YOUR_BRANCH_NAME> develop
   ```

   > You can read about how to name your branch under the [code guidelines](#code-guidelines).

5. Run the development environment. The app is available at `http://localhost:3000`:

   ```bash
   pnpm dev
   ```

6. Create your patch and test your changes. Be sure to follow the [code](#code-guidelines) guidelines.

7. Should you need to update your fork, you can do so by rebasing from `upstream`. Add the remote once:

   ```bash
   git remote add upstream https://github.com/RaunoT/plex-rewind.git
   ```

   Then fetch and rebase whenever you need to:

   ```bash
   git fetch upstream
   git rebase upstream/develop
   git push origin BRANCH_NAME -f
   ```

### Running with Docker

To try your changes in the production image, run `docker compose up --build`. The `docker-compose.yml` in the repository builds the image from the `Dockerfile`, reads its environment from `.env.local` and mounts `./config` for the settings. It maps port `3000` on your machine to the container's `8383`, so the app is available at `http://localhost:3000`, which matches the URLs in `.env.example`.

### README screenshots

The screenshots in `.github/screenshots` use made-up data, so they don't show anyone's real history. `.github/scripts/mock-server.mjs` stands in for Tautulli and Seerr with a 15-person server, and the app still fetches real posters, ratings and links for its titles.

1. Start the mock with your own Plex account as one of its users, so you can sign in. Your ID, name, email and avatar URL are under `user` at `/api/auth/session` while you're signed in to your dev server:

   ```bash
   MOCK_USER_ID=… MOCK_USER_NAME='…' MOCK_USER_EMAIL=… MOCK_USER_THUMB=… node .github/scripts/mock-server.mjs
   ```

2. Run a second copy of the app, so your own settings stay untouched. Settings are read from the folder the app runs in, so a worktree gets its own:

   ```bash
   git worktree add ../plex-rewind-screenshots
   cp .env.local ../plex-rewind-screenshots/
   cd ../plex-rewind-screenshots && pnpm install
   ```

   Save this as `config/settings.json` there, then start it with `NEXTAUTH_URL=http://localhost:3001 pnpm dev -p 3001` and sign in:

   ```json
   {
     "connection": {
       "statisticsSource": "tautulli",
       "tautulliUrl": "http://localhost:8787",
       "tautulliApiKey": "mock",
       "plexUrl": "http://localhost:32400",
       "seerrUrl": "http://localhost:8787",
       "seerrApiKey": "mock",
       "complete": true
     },
     "general": {
       "activeLibraries": ["movies", "tv-shows", "music"],
       "activeExternalLinks": [
         "imdb",
         "tmdb",
         "tvdb",
         "rottenTomatoes",
         "letterboxd",
         "trakt"
       ],
       "complete": true
     },
     "rewind": { "complete": true },
     "dashboard": { "complete": true },
     "activity": { "complete": true },
     "setupComplete": true
   }
   ```

3. Take the screenshots in a 1152×720 window at 2× scale, with the Next.js dev badge hidden, and save them as WebP:

   ```bash
   cwebp -q 82 -m 6 home.png -o .github/screenshots/home.webp
   ```

### Before opening a pull request

Run these and fix anything they report:

```bash
pnpm lint:all
pnpm test
pnpm build
```

`pnpm lint:all` runs ESLint, the TypeScript check, Stylelint and a Prettier check, and `pnpm test` runs the unit tests. The same checks run on every pull request.

### Code guidelines

- If you are taking on an existing bug or feature ticket, please comment on the [issue](https://github.com/RaunoT/plex-rewind/issues) to avoid multiple people working on the same thing.

- All commits must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) rules. Run `pnpm commit` for a guided prompt, or write the message yourself. Besides the usual types (`feat`, `fix`, `docs`, `chore` and so on) there is a `ui` type for UI changes. A commit hook checks the message.

  > Please make meaningful commits, or squash them prior to opening a pull request.

- Do your best to check for spelling errors and grammatical mistakes.

- Put user-facing text in `messages/*.json` instead of in the components, and add each new key to every language file, using `en.json` as the reference.

- Make sure to test your changes on different screen sizes to ensure responsiveness.

- Do your research and follow the best practices for whatever tool or library you're using.

- Use the appropriate Unicode characters for ellipses, arrows, and other special characters/symbols

- Branch and PR naming should follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) logic.

  > Example branch name: `feat(dashboard)/new-feature` or `fix/bug`

  > Example pull request name: `feat(dashboard): new feature` or `fix: bug`

- Make sure to keep your branch up-to-date.

- Only open pull requests to `develop`, never `main`.

  Any pull requests opened to `main` will be closed.
