import { Library } from '@/types'
import { Suspense } from 'react'
import DashboardNavContent from './DashboardNavContent'

export type DashboardNavProps = {
  libraries: Library[]
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
