// @ts-check
import { serwist } from '@serwist/next/config'

const revision = crypto.randomUUID()

export default serwist({
  swSrc: 'src/lib/sw.ts',
  swDest: 'public/sw.js',
  // Only what the offline page needs: its stylesheet and the app icons.
  // Everything else is cached as it's used.
  globPatterns: ['.next/static/**/*.css', 'public/{manifest.json,icon-*.png}'],
  precachePrerendered: false,
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
})
