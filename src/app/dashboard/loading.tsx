import getSettings from '@/utils/getSettings'
import { toPublicSettings } from '@/utils/publicSettings'
import DashboardLoader from './_components/DashboardLoader'

// Which library is loading isn't known yet, so the rows are shaped like movies
export default function Loading() {
  return (
    <DashboardLoader
      toolbar={
        <div className='flex justify-end'>
          <div className='skeleton h-7 w-32' />
        </div>
      }
      type='movie'
      settings={toPublicSettings(getSettings())}
    />
  )
}
