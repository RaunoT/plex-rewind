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
    <div className='flex flex-wrap justify-end gap-2'>
      <Suspense>
        <PeriodSelect settings={settings} />
        {!isUsers && (
          <DashboardFilters
            isSortByPlaysActive={settings.dashboard.isSortByPlaysActive}
            personalFilter={personalFilter}
          />
        )}
      </Suspense>
    </div>
  )
}
