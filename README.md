# Plex Rewind

<p>
  <img src="https://github.com/raunot/plex-rewind/workflows/Release/badge.svg" alt="Plex Rewind release status" />
  <img src="https://github.com/raunot/plex-rewind/workflows/Tests/badge.svg" alt="Plex Rewind tests status">
  <img src="https://img.shields.io/github/v/release/raunot/plex-rewind" alt="Plex Rewind latest release">
</p>

A Plex Rewind application inspired by the likes of [Spotify Wrapped](https://www.spotify.com/us/wrapped) and [Tautulli](https://tautulli.com).

Present [Plex](https://plex.tv) user statistics and habits in a beautiful and organized manner - as a web application application powered by [Next.js](https://nextjs.org) and [Tailwind.css](https://tailwindcss.com), using data from [Tautulli](https://tautulli.com) and [Overseerr](https://overseerr.dev). You can also disable the Rewind functionality and just use it as an easily sharable Dashboard for your Plex users or vice versa!

## Features

- 📱 Fully responsive - viewable on desktop, tablet and mobile.
- 🔄 Fully dynamic - the data your viewing will always be the latest available.
- 📆 Rewind - allows your Plex users view their statistics and habits for a given year.
- 👀 Dashboard - provides an easily glanceable overview of activity on your server for all your libraries.
- 🔗 Integrates with [Overseerr](https://overseerr.dev) and [Tautulli](https://tautulli.com).
- 🔐 Log in with Plex - uses [NextAuth.js](https://next-auth.js.org) to allow securely logging in with your Plex account.
- 🚀 PWA support - installable on mobile devices and desktops.

Keep an eye on our [issues page](https://github.com/RaunoT/plex-rewind/issues) to see what new features have already been requested or to make your own request!

## Preview

![Dashboard](https://i.imgur.com/TRYwNYO.png 'Dashboard')

![Rewind](https://i.imgur.com/JiljJ9I.png 'Rewind')

## Getting started

1. Get the latest release from the [releases page](https://github.com/RaunoT/plex-rewind/releases) or clone the repository:

```
git clone https://github.com/RaunoT/plex-rewind.git --branch main
```

2. Fill out the variables in the `.env` file. Check out [variables reference](#variables-reference) for more information.

3. Run `docker compose build` to build the application and then `docker compose up -d` to start it.

   To update, download the latest release, or if you cloned the repo, run `git pull` and then `docker compose up --build -d`.

4. The application should now be running on [http://localhost:8383](http://localhost:8383).

5. (optional) You can expose the app to the internet using a reverse proxy of your choice. Or you can skip all of the above, fork this repository instead, and deploy it to [Vercel](https://vercel.com). You can set the env variables under "Settings > Environment Variables" for your project.

## Variables reference

### Required variables

- `NEXT_PUBLIC_TAUTULLI_URL` - the URL where your Tautulli instance is located. If it's not running on a custom domain, use a private network address instead of localhost to allow Docker to access it.
  - Example: NEXT_PUBLIC_TAUTULLI_URL=http://192.168.1.2:8181.
- `TAUTULLI_API_KEY` - found in Tautulli under "Settings > Web Interface > API > API Key".
- `TMDB_API_KEY` - used for fetching ratings.
- `PLEX_HOSTNAME` & `PLEX_PORT` - required to get your server ID via the Plex API, which allows setting deeplinks to open your media items.
- `NEXT_PUBLIC_SITE_URL` & `NEXTAUTH_URL` - should be set to the URL where you're hosting the application.
- `NEXTAUTH_SECRET` - used for encrypting the NextAuth.js JWT. It can be generated by:
  - Running `openssl rand -base64 32` in your terminal.
  - Using an online generator like [the one by Vercel](https://generate-secret.vercel.app/32).

### Optional variables

- `NEXT_PUBLIC_OVERSEERR_URL` & `NEXT_PUBLIC_OVERSEERR_API_KEY` - used to fetch requests data from Overseerr and the "Request" button functionality.
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` - can be used to set up Google Analytics.
- `NEXT_PUBLIC_IS_REWIND_DISABLED` - allows disabling Rewind.
- `NEXT_PUBLIC_IS_DASHBOARD_DISABLED` - allows disabling Dashboard.
- `NEXT_PUBLIC_IS_DASHBOARD_USERS_DISABLED` - allows disabling the "Users" page in Dashboard.
- `NEXT_PUBLIC_EXCLUDED_DASHBOARD_STATS` - allows disabling individual statistics from Dashboard pages.
  - Accepted values: duration,plays,users,requests.
- `NEXT_PUBLIC_EXCLUDED_LIBRARIES` - used for excluding libraries from Rewind and Dashboard.
  - Accepted values: library names, separated by a comma.
  - Example: NEXT_PUBLIC_EXCLUDED_LIBRARIES=Movies,Music,TV Shows.
- `NEXT_PUBLIC_STATISTICS_START_DATE` - sets the starting date for the "All time" option in Dashboard.
  - Expects YYYY-MM-DD format and will default to 2018-01-01.

## Donate

If you like this project and wish to support it, you can do so by donating via [Patreon](https://www.patreon.com/PlexRewind) or [PayPal](https://paypal.me/raunot). Thank you!

_Please note that supporting does not guarantee any support or future developments._

## Development

Install dependencies:

```
pnpm
```

Start development:

```
pnpm dev
```

Build for production:

```
pnpm build
```

## Learn More

To learn more about the tools used in this project, take a look at the following resources:

- [Tautulli API reference](https://github.com/Tautulli/Tautulli/wiki/Tautulli-API-Reference)
- [Overseerr API reference](https://api-docs.overseerr.dev)
- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind.css documentation](https://tailwindcss.com/docs)
