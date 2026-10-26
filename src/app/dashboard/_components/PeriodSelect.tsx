import { PublicSettings } from '@/types/settings'
import { Suspense } from 'react'
import PeriodSelectContent from './PeriodSelectContent'

type Props = {
  settings: PublicSettings
}

export default function PeriodSelect({ settings }: Props) {
  return (
    <Suspense>
      <PeriodSelectContent settings={settings} />
    </Suspense>
  )
}
