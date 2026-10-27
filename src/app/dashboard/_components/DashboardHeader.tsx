import { ReactNode } from 'react'

type Props = {
  periodStats: ReactNode
  toolbar: ReactNode
}

// Shared by the dashboard and its loader, so nothing moves once the data
// arrives. The row wraps in reverse, so on narrow screens the filters go on top
// and the period stats stay next to the list. That also turns `items-start`
// into bottom alignment, and the stats' margin lifts them to the bottom of the
// select pills, inside their taller tap area.
export default function DashboardHeader({ periodStats, toolbar }: Props) {
  return (
    <div className='mb-4 flex flex-wrap-reverse items-start justify-between gap-x-4 gap-y-2'>
      <ul className='icon-stats-container gap-x-3 text-neutral-300 empty:hidden max-sm:w-full max-sm:justify-center sm:mb-1.5'>
        {periodStats}
      </ul>
      <div className='w-full sm:ml-auto sm:w-auto'>{toolbar}</div>
    </div>
  )
}
