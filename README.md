# Rewindarr

[![Rewindarr release status](https://img.shields.io/github/actions/workflow/status/RaunoT/plex-rewind/release.yml?label=Release)](https://github.com/RaunoT/plex-rewind/actions/workflows/release.yml)
[<img src="https://img.shields.io/github/v/release/raunot/plex-rewind?label=latest" alt="Rewindarr latest release">](https://github.com/RaunoT/plex-rewind/releases)
[![Rewindarr pre-release status](https://img.shields.io/github/actions/workflow/status/RaunoT/plex-rewind/pre-release.yml?include_prereleases=true&label=Pre-release)](https://github.com/RaunoT/plex-rewind/actions/workflows/pre-release.yml)
[<img src="https://img.shields.io/github/v/release/RaunoT/plex-rewind?include_prereleases&label=develop" alt="Rewindarr develop release">](https://github.com/RaunoT/plex-rewind/releases)

A rewind for your media server, inspired by the likes of [Spotify Wrapped](https://www.spotify.com/us/wrapped) and [Tautulli](https://tautulli.com). Formerly Plex Rewind.

Present [Plex](https://plex.tv) and [Jellyfin](https://jellyfin.org) user statistics and habits in a beautiful and organized manner - as a web application powered by [Next.js](https://nextjs.org) and [Tailwind.css](https://tailwindcss.com), using data from [Tautulli](https://tautulli.com) or [Tracearr](https://github.com/connorgallopo/Tracearr), and [Seerr](https://seerr.dev). You can also disable the Rewind functionality and just use it as an easily sharable Dashboard for your users or vice versa!

| Media server | Statistics from      |
| ------------ | -------------------- |
| Plex         | Tautulli or Tracearr |
| Jellyfin     | Tracearr             |

## Features

- 📱 Fully responsive - viewable, usable & enjoyable on desktop, tablet or mobile.
- 🔄 Fully dynamic - the data you're viewing will always be the latest available.
- 🎭 Anonymization - anonymize user info for enhanced privacy.
- 📆 Rewind - allows your users view their statistics and habits for a (customizable) time period.
- 👀 Dashboard - provides an easily glanceable overview of activity on your server for all your libraries, personalized or general.
- ⚡ Activity - see what's happening on your server in real time.
- 📊 Fuelled by data from [Tautulli](https://tautulli.com) or [Tracearr](https://github.com/connorgallopo/Tracearr) - the backbone responsible for the heavy lifting regarding statistics. Tracearr also brings Jellyfin support.
- 🔗 Integrates with [Seerr](https://seerr.dev) - show request breakdowns and totals and display request buttons next to deleted fan-favorite media items.
- 🍅 Ratings from TMDB, IMDb and Rotten Tomatoes - each can be turned on or off.
- 🔐 Log in with Plex or Jellyfin - secure login and session management with the account you already use for your media server.
- 🚀 PWA support - installable on mobile devices and desktops.
- 🐳 Easy deployment - run the application in a containerized environment with [Docker](https://www.docker.com).
- 🌐 Multi-language support - currently supporting English, Estonian, French, German, Italian and Spanish. See [translations](#translations) for more information.
- ⭐ All of this and more - powered by [Next.js](https://nextjs.org).

Keep an eye on the [issues page](https://github.com/RaunoT/plex-rewind/issues) to see what new features have already been requested or to make your own request!

## Preview

![Home](.github/screenshots/home.webp 'Home')

![Dashboard](.github/screenshots/dashboard.webp 'Dashboard')

![Rewind](.github/screenshots/rewind.webp 'Rewind')

![Activity](.github/screenshots/activity.webp 'Activity')

## Getting started

1. Create a `docker-compose.yml` in your location of choice and run `docker compose up -d`. The app will be available at `http://localhost:8383`.

```yml
services:
  rewindarr:
    image: ghcr.io/raunot/rewindarr:latest # :develop for the latest development version
    container_name: rewindarr
    environment:
      - NEXTAUTH_SECRET= # (required) used to encrypt auth JWT token, generate one with `openssl rand -base64 32`
      - NEXTAUTH_URL=http://localhost:8383 # (required) change to your domain if you are exposing the app to the internet
      - NEXT_PUBLIC_SITE_URL=http://localhost:8383 # (required) change to your domain if you are exposing the app to the internet
      - TZ=Europe/London # (optional) your timezone, used for viewing habits and finish times
      - PUID=1000 # (optional) user ID the app runs as, defaults to 1000
      - PGID=1000 # (optional) group ID the app runs as, defaults to 1000
    volumes:
      - ./config:/app/config
    ports:
      - 8383:8383
    restart: unless-stopped
```

> _NOTE: Coming from Plex Rewind? The images are also published under their old names, `ghcr.io/raunot/plex-rewind` and `raunoot/plex-rewind`, for now. Switch to `ghcr.io/raunot/rewindarr` or `raunoot/rewindarr` and keep the same `config` volume; the settings carry over._

> _NOTE: With Jellyfin, choose Tracearr as the source and pick the Jellyfin server in the connection settings. Users sign in with their Jellyfin username and password, which go to Jellyfin through Rewindarr, so set the Jellyfin URL to one Rewindarr can reach. The same URL is used for links that open titles in Jellyfin. Tracearr doesn't say who is a Jellyfin administrator, so admin rights come from Jellyfin when a user signs in._

> _NOTE: If you run into authentication issues, try setting `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your external Docker IP, instead of localhost. For example `http://192.168.1.1:8383`._

> _NOTE: Rewindarr builds its statistics from the play history, which it reads once and saves to `config/play-history.json.gz`. After that, only the newest plays are read again, even across restarts. The read starts when Rewindarr starts, and its progress is shown in the connection settings. Tautulli is read 5,000 plays at a time, which usually takes seconds. Tracearr is read 100 plays at a time, one request after another, and allows 240 requests a minute by default, so the first read of 100,000 plays takes about 5 minutes. For Tracearr histories over 50,000 plays, set its API rate limit (Settings → Data → API, restart required) to 1,200. A higher value doesn't make it faster, as each request waits for the previous one, and on modest hardware 600 puts less load on Tracearr._

> _NOTE: A play counts once it gets at least halfway through the item, which can be changed in the general settings. Shorter plays still add their watch time, but not a play, so play counts can be lower than Tautulli's or Tracearr's. At 0%, every play counts._

For those that need it, a simple status page is also available at `/api/status`.

## Translations

The application follows the browser's language when it's one of the supported ones, and falls back to English otherwise. A language picked from the language menu takes precedence over the browser's.

To help translate the application to your language, create a new `<language-code>.json` in the `messages` directory and translate the strings, using `en.json` as a reference. Once the translation is complete, create a pull request for review.

## Donate

If you like this project and wish to support it, you can do so on [GitHub Sponsors](https://github.com/sponsors/RaunoT) (preferred) or [Buy Me a Coffee](https://buymeacoffee.com/fr9lzfrhdh). Thank you! ❤️

### Supporters

- NAS Assist

## Star History

<a href="https://star-history.dera.page/#RaunoT/plex-rewind&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://star-history.dera.page/svg?repos=RaunoT/plex-rewind&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://star-history.dera.page/svg?repos=RaunoT/plex-rewind&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://star-history.dera.page/svg?repos=RaunoT/plex-rewind&type=date&legend=top-left" />
 </picture>
</a>
