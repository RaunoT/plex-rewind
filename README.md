# Plex Rewind

[![Plex Rewind release status](https://img.shields.io/github/actions/workflow/status/RaunoT/plex-rewind/release.yml?label=Release)](https://github.com/RaunoT/plex-rewind/actions/workflows/release.yml)
[<img src="https://img.shields.io/github/v/release/raunot/plex-rewind?label=latest" alt="Plex Rewind latest release">](https://github.com/RaunoT/plex-rewind/releases)
[![Plex Rewind pre-release status](https://img.shields.io/github/actions/workflow/status/RaunoT/plex-rewind/pre-release.yml?include_prereleases=true&label=Pre-release)](https://github.com/RaunoT/plex-rewind/actions/workflows/pre-release.yml)
[<img src="https://img.shields.io/github/v/release/RaunoT/plex-rewind?include_prereleases&label=develop" alt="Plex Rewind develop release">](https://github.com/RaunoT/plex-rewind/releases)

A Plex Rewind application inspired by the likes of [Spotify Wrapped](https://www.spotify.com/us/wrapped) and [Tautulli](https://tautulli.com).

Present [Plex](https://plex.tv) user statistics and habits in a beautiful and organized manner - as a web application application powered by [Next.js](https://nextjs.org) and [Tailwind.css](https://tailwindcss.com), using data from [Tautulli](https://tautulli.com), [Overseerr](https://overseerr.dev) and [Plex](https://plex.tv). You can also disable the Rewind functionality and just use it as an easily sharable Dashboard for your Plex users or vice versa!

## Features

- 📱 Fully responsive - viewable, usable & enjoyable on desktop, tablet or mobile, courtesy of [Tailwind.css](https://tailwindcss.com).
- 🔄 Fully dynamic - the data you're viewing will always be the latest available.
- 📆 Rewind - allows your Plex users view their statistics and habits for a chosen time period.
- 👀 Dashboard - provides an easily glanceable overview of activity on your server for all your libraries, personalized or general.
- 📊 Fuelled by data from [Tautulli](https://tautulli.com) - the backbone responsible for the heavy lifting regarding statistics.
- 🔗 Integrates with [Overseerr](https://overseerr.dev) - show request breakdowns and totals and display request buttons straight under deleted fan-favorite media items.
- 🔐 Log in with Plex - uses [NextAuth.js](https://next-auth.js.org) to enable secure login and session management with your Plex account.
- 🚀 PWA support - installable on mobile devices and desktops thanks to [Serwist](https://github.com/serwist/serwist).
- 🐳 Easy deployment - run the application in a containerized environment with [Docker](https://www.docker.com).
- ✨ Beautiful animations with [Framer Motion](https://www.framer.com/motion).
- 🌐 Multi-language support - currently supporting English and Estonian. See [translations](#translations) for more information.
- ⭐ All of this and more - powered by [Next.js](https://nextjs.org).

Keep an eye on the [issues page](https://github.com/RaunoT/plex-rewind/issues) to see what new features have already been requested or to make your own request!

## Preview

![Dashboard](https://i.imgur.com/6UKEp7v.png 'Dashboard')

![Rewind](https://i.imgur.com/w536oB5.png 'Rewind')

## Getting started

1. Create a `docker-compose.yml` in your location of choice and run `docker compose up -d`. The app will be available at `http://localhost:8383`.

```yml
services:
  plex-rewind:
    image: ghcr.io/raunot/plex-rewind:latest # :develop for the latest development version
    container_name: plex-rewind
    environment:
      - NEXTAUTH_SECRET= # (required) used to encrypt auth JWT token, generate one with `openssl rand -base64 32`
      - NEXTAUTH_URL=http://localhost:8383 # (required) change to your domain if you are exposing the app to the internet
      - NEXT_PUBLIC_SITE_URL=http://localhost:8383 # (required) change to your domain if you are exposing the app to the internet
    volumes:
      - ./config:/app/config
    ports:
      - 8383:8383
    restart: unless-stopped
```

> _NOTE: If you run into authentication issues, try setting `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your external Docker IP, instead of localhost. For example `http://192.168.1.1:8383`._

For those that need it, a simple status page is also available at `/api/status`.

### Unraid

Plex Rewind is also available in the Community Apps store for Unraid. Search for "Plex Rewind" and install it from grtgbln's repository.

### Updating

To update, run `docker compose pull` and then `docker compose up -d`.

Optionally, you can also set up automatic updates with [Watchtower](https://containrrr.dev/watchtower).

## Translations

To help translate the application to your language, create a new `<language-code>.json` in the `messages` directory and translate the strings, using `en.json` as a reference. Once the translation is complete, create a pull request for review.

## Donate

If you like this project and wish to support it, you can do so with a one-time donation via [PayPal](https://paypal.me/raunot) or a recurring one on [Patreon](https://www.patreon.com/PlexRewind) or [GitHub Sponsors](https://github.com/sponsors/RaunoT) (preferred). Thank you! ❤️

### Supporters

- NAS Assist

## Learn More

To learn more about some of the tools used in this project, take a look at the following resources:

- [Tautulli API reference](https://docs.tautulli.com/extending-tautulli/api-reference)
- [Overseerr API reference](https://api-docs.overseerr.dev)
- [Next.js docs](https://nextjs.org/docs)
- [NextAuth.js docs](https://next-auth.js.org/getting-started/introduction)
