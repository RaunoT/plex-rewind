import { Settings } from '@/types'
import { Suspense } from 'react'
import PeriodSelectContent from './PeriodSelectContent'

type Props = {
  settings: Settings
}

export default function PeriodSelect({ settings }: Props) {
  return (
    <Suspense>
      <PeriodSelectContent settings={settings} />
    </Suspense>
  )
}
