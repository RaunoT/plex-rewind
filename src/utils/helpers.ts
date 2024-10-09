import batSvg from '@/assets/profiles/bat.svg'
import butterflySvg from '@/assets/profiles/butterfly.svg'
import catSvg from '@/assets/profiles/cat.svg'
import duckSvg from '@/assets/profiles/duck.svg'
import giraffeSvg from '@/assets/profiles/giraffe.svg'
import hippoSvg from '@/assets/profiles/hippo.svg'
import kangarooSvg from '@/assets/profiles/kangaroo.svg'
import lionSvg from '@/assets/profiles/lion.svg'
import monkeySvg from '@/assets/profiles/monkey.svg'
import mooseSvg from '@/assets/profiles/moose.svg'
import octopusSvg from '@/assets/profiles/octopus.svg'
import ostrichSvg from '@/assets/profiles/ostrich.svg'
import rabbitSvg from '@/assets/profiles/rabbit.svg'
import racoonSvg from '@/assets/profiles/racoon.svg'
import sharkSvg from '@/assets/profiles/shark.svg'
import snakeSvg from '@/assets/profiles/snake.svg'
import tigerSvg from '@/assets/profiles/tiger.svg'
import turtleSvg from '@/assets/profiles/turtle.svg'

import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { ANONYMIZED_ANIMALS, PERIODS, SETTINGS_PAGES } from './constants'

const REQUIRED_SETTINGS = [
  'connection.tautulliUrl',
  'connection.tautulliApiKey',
  'connection.plexUrl',
  'connection.complete',
  'general.complete',
  'rewind.complete',
  'dashboard.customPeriod',
  'dashboard.startDate',
  'dashboard.complete',
]

export function checkRequiredSettings(settings: Settings): string | null {
  for (const key of REQUIRED_SETTINGS) {
    const keys = key.split('.')
    // @ts-expect-error - TODO: we know this is safe, but should still look to resolve without exception
    const settingValue = keys.reduce((acc, curr) => acc && acc[curr], settings)

    if (!settingValue) {
      return key
    }
  }

  return null
}

export function getSettingsPage(missingSettingKey: string): string | undefined {
  return SETTINGS_PAGES.find((page) => missingSettingKey.startsWith(page.key))
    ?.href
}

export function getRewindDateRange(settings: Settings) {
  const startDate = settings.rewind.startDate || PERIODS.pastYear.string
  const endDate =
    settings.rewind.endDate || new Date().toISOString().split('T')[0]

  return { startDate, endDate }
}

export function anonymizeUsers(
  users: TautulliItemRow[],
  loggedInUserId: string,
): TautulliItemRow[] {
  const usedNames = new Set<string>()

  return users.map((user) => {
    const isLoggedIn = user.user_id === Number(loggedInUserId)

    let anonName

    do {
      anonName =
        ANONYMIZED_ANIMALS[
          Math.floor(Math.random() * ANONYMIZED_ANIMALS.length)
        ]
    } while (usedNames.has(anonName))

    usedNames.add(anonName)

    return {
      ...user,
      user: isLoggedIn ? user.user : 'Anonymous ' + anonName,
      friendly_name: isLoggedIn ? user.friendly_name : 'Anonymous ' + anonName,
      user_thumb: isLoggedIn ? user.user_thumb : anonName,
      user_id: isLoggedIn ? user.user_id : 0,
    }
  })
}

export function getAnimalIcon(animal: string) {
  switch (animal) {
    case 'Bat':
      return batSvg
    case 'Butterfly':
      return butterflySvg
    case 'Cat':
      return catSvg
    case 'Duck':
      return duckSvg
    case 'Giraffe':
      return giraffeSvg
    case 'Hippo':
      return hippoSvg
    case 'Kangaroo':
      return kangarooSvg
    case 'Lion':
      return lionSvg
    case 'Monkey':
      return monkeySvg
    case 'Moose':
      return mooseSvg
    case 'Octopus':
      return octopusSvg
    case 'Ostrich':
      return ostrichSvg
    case 'Rabbit':
      return rabbitSvg
    case 'Racoon':
      return racoonSvg
    case 'Shark':
      return sharkSvg
    case 'Snake':
      return snakeSvg
    case 'Tiger':
      return tigerSvg
    case 'Turtle':
      return turtleSvg
  }
}
