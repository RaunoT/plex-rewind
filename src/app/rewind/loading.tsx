import SkeletonLine from '@/components/SkeletonLine'

// Laid out like the opening story, with the progress bar where it will be
export default function Loading() {
  return (
    <div className='relative flex flex-1'>
      <div className='absolute -top-2 right-0 left-0 py-2'>
        <div className='skeleton h-1' />
      </div>
      <div className='w-full flex-1 pt-8 sm:flex sm:flex-col sm:justify-center'>
        <div className='skeleton mb-8 size-24' />
        <div className='mb-4 text-3xl leading-tight sm:text-4xl'>
          <SkeletonLine width='w-10/12' />
          <SkeletonLine width='w-7/12' />
        </div>
        <div className='skeleton h-5 w-15' />
      </div>
    </div>
  )
}
