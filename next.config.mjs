import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/lib/sw.ts',
  swDest: 'public/sw.js',
})
const tautulliUrl = new URL(process.env.NEXT_PUBLIC_TAUTULLI_URL)
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'plex.tv',
      },
      {
        protocol: tautulliUrl.protocol.slice(0, -1),
        hostname: tautulliUrl.host,
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
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self' data:; connect-src 'self' https://plex.tv https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;",
          },
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)
