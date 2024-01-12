'use server'

import { db } from '@/lib/db'

export async function getSettings() {
  const settings = await db.settings.findFirst({
    where: {
      id: 1,
    },
  })

  return settings
}
