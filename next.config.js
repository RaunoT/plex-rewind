/** @type {import('next').NextConfig} */
/** https://nextjs.org/docs/api-reference/next.config.js/introduction */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      // TODO: get from NEXT_PUBLIC_TAUTULLI_URL
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'plex.tv',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: '',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self' data:; connect-src 'self' *.google-analytics.com https://plex.tv;",
          },
        ],
      },
    ]
  },
}
