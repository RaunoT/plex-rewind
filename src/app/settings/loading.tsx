import SkeletonLine from '@/components/SkeletonLine'

// Laid out like a settings form's sections
export default function Loading() {
  return (
    <div className='glass-sheet'>
      <div className='grid gap-4'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='group-settings'>
            <div className='border-b border-white/10 pb-2 sm:w-48'>
              <SkeletonLine className='text-xs sm:justify-end' width='w-24' />
            </div>
            <div className='flex flex-col-reverse gap-2 sm:flex-row-reverse sm:items-center'>
              {/* An empty input */}
              <div className='h-10 w-full rounded-xl bg-white/5' />
              <SkeletonLine
                className='text-xs sm:w-48 sm:shrink-0 sm:justify-end sm:text-sm'
                width='w-20'
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
