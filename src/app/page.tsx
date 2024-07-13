import getSettings from '@/utils/getSettings'
import { Suspense } from 'react'
import Home from './_components/Home'

export default async function HomePage() {
  const settings = await getSettings()

  return (
    <Suspense>
      <Home settings={settings} />
    </Suspense>
  )
}
