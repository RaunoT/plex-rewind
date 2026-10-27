'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import SkeletonLine from '@/components/SkeletonLine'
import { useContext } from 'react'

// Built like an activity card for an episode, so nothing moves once it loads
export default function ActivitiesSkeleton() {
  const {
    activity: { isDetailsHidden },
  } = useContext(GlobalContext)

  return (
    <div className='w-full'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex min-w-0 flex-1 items-center gap-2 text-sm'>
          <div className='skeleton size-6 shrink-0' />
          <SkeletonLine width='w-48' />
        </div>
        <div className='skeleton h-5 w-20 shrink-0 sm:h-6' />
      </div>
      <div className='flex gap-4'>
        <div className='skeleton poster' />
        <div className='flex min-w-0 flex-1 flex-col'>
          <SkeletonLine className='text-xs sm:text-sm' width='w-40' />
          <SkeletonLine
            className='leading-snug sm:text-lg'
            width='w-2/3 sm:w-1/2'
          />
          <SkeletonLine className='mt-0.5 text-xs sm:text-sm' width='w-24' />
          <div className='mt-auto pt-3 text-xs'>
            <div className='skeleton h-1.5 w-full' />
            <div className='mt-1.5 flex justify-between gap-3'>
              <SkeletonLine width='w-16' />
              <SkeletonLine width='w-24' />
            </div>
          </div>
        </div>
      </div>
      {!isDetailsHidden && (
        <div className='mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-black/25 p-4 text-sm ring-1 ring-white/10 ring-inset sm:grid-cols-3'>
          {[...Array(7)].map((_, i) => (
            <div key={i}>
              <SkeletonLine className='mb-0.5 text-xs' width='w-16' />
              <SkeletonLine width='w-24' />
              {/* The audio line is the one that wraps on phones */}
              {i === 4 && <SkeletonLine className='sm:hidden' width='w-16' />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
