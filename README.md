# Plex Rewind

A Plex Rewind application in the spirit of [Spotify Wrapped](https://www.spotify.com/us/wrapped).

Present user statistics and habits in a beautiful and organized manner - as a web application application powered by [Next.js](https://nextjs.org) and [Tailwind.css](https://tailwindcss.com), using data from [Tautulli](https://tautulli.com) and [Overseerr](https://overseerr.dev/). You can also disable the Rewind functionality and just use it as a sharable Dashboard for your Plex users or vice versa.

![Dashboard](https://i.imgur.com/gSDRySM.png 'Dashboard')

![Rewind](https://i.imgur.com/AfjFNFJ.png 'Rewind')

## Getting started

This project is ongoing active development and is not considered stable. If you still wish to try it out, you can follow the instructions below.

1. Clone the repository:

```
git clone https://github.com/RaunoT/plex-rewind.git
```

2. Fill out the variables in the `.env` file.

- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is optional and can be left out if you don't want to use Google Analytics.
- `NEXT_PUBLIC_OVERSEERR_URL` and `NEXT_PUBLIC_OVERSEERR_API_KEY` are also optional, if you don't want to fetch requests data from Overseerr or display the "Request" button for media items.
- You can use `NEXT_PUBLIC_EXCLUDED_LIBRARIES` to exclude certain libraries from Rewind and Dashboard. Accepted values are library names, separated by a comma. For example: `NEXT_PUBLIC_EXCLUDED_LIBRARIES=Movies,Music`.
- You can generate a `NEXTAUTH_SECRET` by running `openssl rand -base64 32` in your terminal, or by using an online generator like [the one by Vercel](https://generate-secret.vercel.app/32).

3. You can now run `docker compose up` to start the application. You can use `docker compose build` to rebuild the application after changes.

4. The application should now be running on [http://localhost:3000](http://localhost:3000).

5. (optional) You can expose the app to the internet using a reverse proxy of your choice. Or you can skip all of the above, fork this repository instead, and deploy it to [Vercel](https://vercel.com). You can set the env variables under "Settings" > "Environment Variables" for your project.

## Development

Install dependencies:

```
yarn
```

Start development:

```
yarn dev
```

## Learn More

To learn more about the tools used in this project, take a look at the following resources:

- [Tautulli API reference](https://github.com/Tautulli/Tautulli/wiki/Tautulli-API-Reference)
- [Overseerr API reference](https://api-docs.overseerr.dev)
- [Next.js documentation](https://nextjs.org/docs)
- [Tailwind.css documentation](https://tailwindcss.com/docs)
