import SkeletonLine from '@/components/SkeletonLine'
import HeaderControls from './_components/HeaderControls'

// Laid out like the home page's tiles. Also shown for a moment while another
// section's layout loads.
export default function Loading() {
  return (
    <div className='page-width'>
      <header
        data-page-header
        className='mb-6 flex min-h-10 items-center justify-between gap-3'
      >
        <SkeletonLine className='text-2xl sm:text-3xl' width='w-48' />
        <HeaderControls className='lg:group-data-[sidebar]/app:hidden' />
      </header>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='glass-sheet flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <div className='skeleton size-5 shrink-0' />
              <SkeletonLine width='w-24' />
            </div>
            <div className='flex items-center gap-3'>
              <div className='skeleton poster w-12' />
              <div className='min-w-0 flex-1'>
                <SkeletonLine className='text-xs' width='w-28' />
                <SkeletonLine width='w-2/3' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
