import { PublicSettings } from '@/types/settings'
import { Suspense } from 'react'
import DashboardFilters from './DashboardFilters'
import PeriodSelect from './PeriodSelect'

type Props = {
  settings: PublicSettings
  personalFilter?: boolean
  isUsers?: boolean
}

// Rendered by both the dashboard and its loader, so the filters stay on screen
// while a new period or filter loads
export default function DashboardToolbar({
  settings,
  personalFilter = false,
  isUsers = false,
}: Props) {
  return (
    // On small screens the selects share the full width
    <div className='flex min-h-10 flex-wrap items-center justify-end gap-2 *:flex-1 sm:*:flex-none'>
      <Suspense>
        <PeriodSelect settings={settings} />
        {!isUsers && <DashboardFilters personalFilter={personalFilter} />}
      </Suspense>
    </div>
  )
}
