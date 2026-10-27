import { authOptions } from '@/lib/auth'
import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { checkRequiredSettings, sortByActiveLibraries } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
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
        />
      </Suspense>
    )
  }

  const libraries = sortByActiveLibraries(await getLibraries(), settings)

  return (
    <Overview settings={settings} session={session} libraries={libraries} />
  )
}
