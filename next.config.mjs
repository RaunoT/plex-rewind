import withSerwistInit from '@serwist/next'

const remotePatterns = [
  {
    protocol: 'http',
    hostname: 'localhost',
  },
  {
    protocol: 'https',
    hostname: 'plex.tv',
  },
]

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
    remotePatterns,
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
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)
