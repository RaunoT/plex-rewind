import { TautulliLibrary } from '@/types/tautulli'
import { Suspense } from 'react'
import DashboardNavContent from './DashboardNavContent'

export type DashboardNavProps = {
  libraries: TautulliLibrary[]
  isUsersPageActive: boolean
  isMenu?: boolean
}

export default function DashboardNav(props: DashboardNavProps) {
  return (
    <Suspense>
      <DashboardNavContent {...props} />
    </Suspense>
  )
}
