import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const db =
  globalThis.prisma ||
  new PrismaClient({
    log: ['warn', 'error'], // query, info
  })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
