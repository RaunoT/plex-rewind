'use server'

import { canManageSettings } from '@/lib/access'
import { HistoryStatus } from '@/types/playHistory'
import { StatisticsSource } from '@/types/settings'
import {
  getHistoryStatus as getStatus,
  readHistoryAgain as readAgain,
} from '@/utils/statsSource'

const SOURCES: StatisticsSource[] = ['tautulli', 'tracearr']

// Null for anyone who can't manage the settings
export async function getHistoryStatus(
  source: StatisticsSource,
): Promise<HistoryStatus | null> {
  return SOURCES.includes(source) && (await canManageSettings())
    ? getStatus(source)
    : null
}

export async function readHistoryAgain(
  source: StatisticsSource,
): Promise<HistoryStatus | null> {
  if (!SOURCES.includes(source) || !(await canManageSettings())) {
    return null
  }

  await readAgain(source)

  return getStatus(source)
}
