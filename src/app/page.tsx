import { Suspense } from 'react'
import Home from './_components/Home'

export default function HomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}
