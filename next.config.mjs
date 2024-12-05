import withSerwistInit from '@serwist/next'
import createNextIntlPlugin from 'next-intl/plugin'

const isDev = process.env.NODE_ENV !== 'production'
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
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
  // logging: {
  //   fetches: {
  //     fullUrl: true,
  //   },
  // },
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
        ],
      },
    ]
  },
}
const revision = crypto.randomUUID()
const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  swSrc: 'src/lib/sw.ts',
  swDest: 'public/sw.js',
  disable: isDev,
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
})
const withNextIntl = createNextIntlPlugin()

export default withSerwist(withNextIntl(nextConfig))
