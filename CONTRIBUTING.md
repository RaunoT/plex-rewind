# Contributing to Plex Rewind

Any contributions are welcome and greatly appreciated!

Please follow the guidelines below.

## Development

### Tools

- [Git](https://git-scm.com) for source control
- [NodeJS](https://nodejs.org) (20.x or higher)
- [VSCode](https://code.visualstudio.com) is highly recommended as an editor

  > Upon opening the project, a few extensions will be automatically recommended for install. These are highly recommended to install and will make development easier. You can find the list in `.vscode/extensions.json`.

- [pnpm](https://pnpm.io) as a package manager

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

5. Run the development environment:

   ```bash
   pnpm dev
   ```

6. Create your patch and test your changes. Be sure to follow the [code](#code-guidelines) guidelines.

7. Should you need to update your fork, you can do so by rebasing from `upstream`:

   ```bash
   git fetch upstream
   git rebase upstream/develop
   git push origin BRANCH_NAME -f
   ```

### Code guidelines

- If you are taking on an existing bug or feature ticket, please comment on the [issue](https://github.com/RaunoT/plex-rewind/issues) to avoid multiple people working on the same thing.

- All commits must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) rules.

  > Please make meaningful commits, or squash them prior to opening a pull request.

- Do your best to check for spelling errors and grammatical mistakes.

- Make sure to test your changes on different screen sizes to ensure responsiveness.

- Do your research and follow the best practices for whatever tool or library you're using.

- Use the appropriate Unicode characters for ellipses, arrows, and other special characters/symbols

- Branch and PR naming should follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) logic. If there's an issue linked to the PR, it should be included in the scope.

  > Example branch name: `feat(#123)/new-feature` or `fix/bug`

  > Example pull request name: `feat(#123): new feature` or `fix: bug`

- Always rebase your commit to the latest `develop` branch.

  Do **not** merge `develop` into your branch.

- Make sure to keep your branch up-to-date.

- Only open pull requests to `develop`, never `main`.

  Any pull requests opened to `main` will be closed.
