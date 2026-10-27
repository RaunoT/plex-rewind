import { ReactNode } from 'react'

type Props = {
  periodStats: ReactNode
  toolbar: ReactNode
}

// Shared by the dashboard and its loader, so nothing moves once the data
// arrives. The row wraps in reverse, so on narrow screens the filters go on top
// and the period stats stay next to the list. That also turns `items-start`
// into bottom alignment.
export default function DashboardHeader({ periodStats, toolbar }: Props) {
  return (
    <div className='mb-4 flex flex-wrap-reverse items-start justify-between gap-x-4 gap-y-2'>
      <ul className='icon-stats-container gap-x-3 text-neutral-300 empty:hidden'>
        {periodStats}
      </ul>
      <div className='ml-auto'>{toolbar}</div>
    </div>
  )
}
