'use client'

import RouteError, { RouteErrorProps } from '@/components/RouteError'
import SkeletonSized from '@/components/SkeletonSized'
import ActivitiesSkeleton from './_components/ActivitiesSkeleton'

export default function Error(props: RouteErrorProps) {
  return (
    <SkeletonSized skeleton={<ActivitiesSkeleton />}>
      <RouteError {...props} logPrefix='ACTIVITY' isInCard />
    </SkeletonSized>
  )
}
