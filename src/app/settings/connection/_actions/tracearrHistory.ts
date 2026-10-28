'use server'

import { canManageSettings } from '@/lib/access'
import { TracearrHistoryStatus } from '@/types/tracearr'
import {
  getTracearrHistoryStatus,
  rereadTracearrHistory,
} from '@/utils/fetchTracearr'
import getSettings from '@/utils/getSettings'
import { isTracearrSource } from '@/utils/helpers'

async function canReadHistory(): Promise<boolean> {
  const settings = getSettings()

  return isTracearrSource(settings) && (await canManageSettings(settings))
}

// Null without Tracearr, or for anyone who can't manage the settings
export async function getHistoryStatus(): Promise<TracearrHistoryStatus | null> {
  return (await canReadHistory()) ? getTracearrHistoryStatus() : null
}

export async function readHistoryAgain(): Promise<TracearrHistoryStatus | null> {
  if (!(await canReadHistory())) {
    return null
  }

  await rereadTracearrHistory()

  return getTracearrHistoryStatus()
}
