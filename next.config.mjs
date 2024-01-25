import withSerwistInit from '@serwist/next'
import settings from './src/config/settings.json' assert { type: 'json' }

const tautulliUrl = new URL(settings.connection.tautulliUrl)
const isDev = process.env.NODE_ENV !== 'production'
const withSerwist = withSerwistInit({
  swSrc: 'src/lib/sw.ts',
  swDest: 'public/sw.js',
  disable: isDev,
})
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
  logging: {
    fetches: {
      fullUrl: true,
    },
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
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://plex.tv https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;",
          },
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)
