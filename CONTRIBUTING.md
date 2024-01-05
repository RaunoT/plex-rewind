# Contributing to Plex Rewind

Any contributions are welcome and greatly appreciated!

Please follow the guidelines below.

## Development

### Tools

- [Git](https://git-scm.com)
- [NodeJS](https://nodejs.org) (18.x or higher)
- [VSCode](https://code.visualstudio.com) is highly recommended.

  Upon opening the project, a few extensions will be automatically recommended for install.

- [pnpm](https://pnpm.io)

### Getting Started

1. [Fork](https://help.github.com/articles/fork-a-repo/) the repository to your own GitHub account and [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device:

   ```bash
   git clone https://github.com/YOUR_USERNAME/plex-rewind.git
   cd plex-rewind
   ```

2. Install the project dependencies:

   ```bash
   pnpm i
   ```

3. Create a new branch:

   ```bash
   git checkout -b BRANCH_NAME develop
   ```

4. Run the development environment:

   ```bash
   pnpm dev
   ```

   Alternatively, you can use [Docker](https://www.docker.com) with `docker compose up --build -d`. This method does not require installing NodeJS or pnpm on your machine directly, but will be slower to start up and check for changes.

5. Create your patch and test your changes. Be sure to follow the [code](#contributing-code) guidelines.

6. Should you need to update your fork, you can do so by rebasing from `upstream`:

   ```bash
   git fetch upstream
   git rebase upstream/develop
   git push origin BRANCH_NAME -f
   ```

### Contributing Code

- If you are taking on an existing bug or feature ticket, please comment on the [issue](https://github.com/RaunoT/plex-rewind/issues) to avoid multiple people working on the same thing.
- All commits must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) rules.

  Pull requests with commits not following this standard will **not** be merged.

- Do your best to check for spelling errors and grammatical mistakes.

- Use the appropriate Unicode characters for ellipses, arrows, and other special characters/symbols

- Please make meaningful commits, or squash them prior to opening a pull request.

  Do **not** squash commits once people have begun reviewing your changes.

- Always rebase your commit to the latest `develop` branch.

  Do **not** merge `develop` into your branch.

- It is your responsibility to keep your branch up-to-date.

  Your work will **not** be merged unless it is rebased off the latest `develop` branch.

- Only open pull requests to `develop`, never `main`.

  Any pull requests opened to `main` will be closed.

## Attribution

This contribution guide was inspired by [Overseerr's](https://github.com/sct/overseerr) contribution guide.
