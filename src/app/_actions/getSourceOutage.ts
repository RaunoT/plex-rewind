'use server'

import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { checkRequiredSettings } from '@/utils/helpers'
import {
  getSourceOutage as fetchSourceOutage,
  SourceOutage,
} from '@/utils/statsSource'
import { getServerSession } from 'next-auth'

// Null for anyone who can't browse the stats
export default async function getSourceOutage(): Promise<SourceOutage | null> {
  const settings = getSettings()

  if (checkRequiredSettings(settings)) {
    return null
  }

  const session = await getServerSession(authOptions)

  if (!session && !settings.general.isOutsideAccess) {
    return null
  }

  return fetchSourceOutage(settings)
}
