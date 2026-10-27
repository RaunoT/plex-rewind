import { authOptions } from '@/lib/auth'
import { getSiteUrl } from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import { checkRequiredSettings, sortByActiveLibraries } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { getReachableLibraries } from '@/utils/statsSource'
import { getServerSession } from 'next-auth'
import { Suspense } from 'react'
import Home from './_components/Home'
import Overview from './_components/Overview'

export default async function HomePage() {
  const settings = getSettings()
  const missingSetting = checkRequiredSettings(settings)
  const session = await getServerSession(authOptions)

  if (missingSetting || (!session && !settings.general.isOutsideAccess)) {
    return (
      <Suspense>
        <Home
          settings={toPublicSettings(settings)}
          missingSetting={missingSetting}
          siteUrl={getSiteUrl()}
        />
      </Suspense>
    )
  }

  const libraries = await getReachableLibraries()

  return (
    <Overview
      settings={settings}
      session={session}
      libraries={libraries && sortByActiveLibraries(libraries, settings)}
    />
  )
}
