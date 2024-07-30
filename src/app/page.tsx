import getSettings from '@/utils/getSettings'
import { Suspense } from 'react'
import Home from './_components/Home'

export default function HomePage() {
  const settings = getSettings()

  return (
    <Suspense>
      <Home settings={settings} />
    </Suspense>
  )
}
