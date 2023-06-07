/** @type {import('next').NextConfig} */
/** https://nextjs.org/docs/api-reference/next.config.js/introduction */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tautulli.rauno.eu',
      },
    ],
  },
}
