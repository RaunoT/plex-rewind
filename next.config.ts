import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Settings are read from the config volume at runtime, never bundled
  outputFileTracingExcludes: {
    '/*': ['config/**'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/image',
      },
    ],
    remotePatterns: [
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // includeSubDomains/preload would commit every self-hosted domain's
          // subdomains to HTTPS, which isn't this app's call to make.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'",
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
const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
