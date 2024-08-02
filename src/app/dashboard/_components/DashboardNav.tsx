import { TautulliLibrary } from '@/types/tautulli'
import { Suspense } from 'react'
import DashboardNavContent from './DashboardNavContent'

export type DashboardNavProps = {
  libraries: TautulliLibrary[]
  isUsersPageActive: boolean
}

export default function DashboardNav({
  libraries,
  isUsersPageActive,
}: DashboardNavProps) {
  return (
    <Suspense>
      <DashboardNavContent
        libraries={libraries}
        isUsersPageActive={isUsersPageActive}
      />
    </Suspense>
  )
}
