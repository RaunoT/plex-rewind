import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { checkRequiredSettings } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { Suspense } from 'react'
import Home from './_components/Home'

export default async function HomePage() {
  const settings = getSettings()
  const libraries = await getLibraries()

  return (
    <Suspense>
      <Home
        settings={toPublicSettings(settings)}
        missingSetting={checkRequiredSettings(settings)}
        libraries={libraries}
      />
    </Suspense>
  )
}
