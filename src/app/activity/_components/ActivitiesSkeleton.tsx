export default function ActivitiesSkeleton() {
  return (
    <div className='space-y-6 sm:space-y-8'>
      <ActivitySkeletonItem />
    </div>
  )
}

function ActivitySkeletonItem() {
  return (
    <div className='w-full'>
      <div className='flex gap-3'>
        {/* Poster skeleton */}
        <div className='h-fit'>
          <div className='skeleton poster'></div>
          <div className='mt-2 flex flex-col items-center gap-1'>
            <div className='skeleton w-12'></div>
            <div className='skeleton w-16 py-1'></div>
          </div>
        </div>

        <div className='w-full'>
          {/* Title */}
          <div className='mb-3'>
            <div className='skeleton mb-1 w-32'></div>
            <div className='skeleton mb-1 w-40 sm:py-3'></div>
            <div className='skeleton w-28'></div>
          </div>
          {/* Stream info */}
          <div className='flex flex-col flex-wrap gap-3 text-xs sm:flex-row sm:gap-4 sm:gap-x-6'>
            <div className='space-y-1'>
              <div className='skeleton w-20'></div>
              <div className='skeleton w-16'></div>
              <div className='skeleton w-12'></div>
            </div>
            <div className='space-y-1'>
              <div className='skeleton w-20'></div>
              <div className='skeleton w-16'></div>
              <div className='skeleton w-12'></div>
            </div>
            <div className='hidden space-y-1 sm:block'>
              <div className='skeleton w-20'></div>
              <div className='skeleton w-16'></div>
              <div className='skeleton w-12'></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='mt-4 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='skeleton size-12 rounded-full'></div>
          <div>
            <div className='skeleton mb-1 w-24'></div>
            <div className='skeleton w-20'></div>
          </div>
        </div>
        <div className='skeleton'></div>
      </div>
    </div>
  )
}
