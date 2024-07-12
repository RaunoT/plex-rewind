import { Suspense } from 'react'
import PeriodSelectContent from './PeriodSelectContent'

export default function PeriodSelect() {
  return (
    <Suspense>
      <PeriodSelectContent />
    </Suspense>
  )
}
