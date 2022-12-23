const nextConfig = {
  experimental: {
    appDir: true,
  },
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

module.exports = nextConfig
