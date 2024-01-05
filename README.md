# Plex Rewind

<p>
  <img src="https://github.com/raunot/plex-rewind/workflows/Release/badge.svg" alt="Plex Rewind release status" />
  <img src="https://github.com/raunot/plex-rewind/workflows/Tests/badge.svg" alt="Plex Rewind tests status">
  <img src="https://img.shields.io/github/v/release/raunot/plex-rewind" alt="Plex Rewind latest release">
</p>

A Plex Rewind application inspired by the likes of [Spotify Wrapped](https://www.spotify.com/us/wrapped) and [Tautulli](https://tautulli.com).

Present [Plex](https://plex.tv) user statistics and habits in a beautiful and organized manner - as a web application application powered by [Next.js](https://nextjs.org) and [Tailwind.css](https://tailwindcss.com), using data from [Tautulli](https://tautulli.com), [Overseerr](https://overseerr.dev) and [Plex](https://plex.tv). You can also disable the Rewind functionality and just use it as an easily sharable Dashboard for your Plex users or vice versa!

## Features

- 📱 Fully responsive - viewable, usable & enjoyable on desktop, tablet or mobile, courtesy of [Tailwind.css](https://tailwindcss.com).
- 🔄 Fully dynamic - the data your're viewing will always be the latest available.
- 📆 Rewind - allows your Plex users view their statistics and habits for a given year.
- 👀 Dashboard - provides an easily glanceable overview of activity on your server for all your libraries.
- ✨ Beautiful animations by [Framer Motion](https://www.framer.com/motion).
- 🔗 Integrates with [Overseerr](https://overseerr.dev) & [Tautulli](https://tautulli.com).
- 🔐 Log in with Plex - uses [NextAuth.js](https://next-auth.js.org) to allow securely logging in with your Plex account.
- 🚀 PWA support - installable on mobile devices and desktops, powered by [Serwist](https://github.com/serwist/serwist).
- ⭐ All of this and more - Powered by [Next.js](https://nextjs.org).

Keep an eye on the [issues page](https://github.com/RaunoT/plex-rewind/issues) to see what new features have already been requested or to make your own request!

## Preview

![Dashboard](https://i.imgur.com/TRYwNYO.png 'Dashboard')

![Rewind](https://i.imgur.com/JiljJ9I.png 'Rewind')

## Getting started

1. Get the latest release from the [releases page](https://github.com/RaunoT/plex-rewind/releases) or clone the repository:

```
git clone https://github.com/RaunoT/plex-rewind.git --branch main
```

2. Fill out the variables in the `.env` file. Check out the [variables reference](https://github.com/RaunoT/plex-rewind/wiki/Variables-reference) section in the Wiki for more information.

3. Run `docker compose build` to build the application and then `docker compose up -d` to start it.

   To update, download the latest release, or if you cloned the repo, run `git pull` and then `docker compose up --build -d`.

4. The application should now be running on [http://localhost:8383](http://localhost:8383).

5. (optional) You can expose the app to the internet using a reverse proxy of your choice. Or you can skip all of the above, fork this repository instead, and deploy it to [Vercel](https://vercel.com). You can set the env variables under "Settings > Environment Variables" for your project.

## Donate

If you like this project and wish to support it, you can do so by donating via [Patreon](https://www.patreon.com/PlexRewind) or [PayPal](https://paypal.me/raunot). Thank you!

_Please note that supporting does not guarantee any support or future developments._

## Learn More

To learn more about some of the tools used in this project, take a look at the following resources:

- [Plex Rewind wiki](https://github.com/RaunoT/plex-rewind/wiki)
- [Tautulli API reference](https://github.com/Tautulli/Tautulli/wiki/Tautulli-API-Reference)
- [Overseerr API reference](https://api-docs.overseerr.dev)
- [Next.js docs](https://nextjs.org/docs)
- [NextAuth.js docs](https://next-auth.js.org/getting-started/introduction)
- [Tailwind.css docs](https://tailwindcss.com/docs)
- [Framer Motion docs](https://www.framer.com/docs)
