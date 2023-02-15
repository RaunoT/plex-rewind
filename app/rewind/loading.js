export default function Loading() {
  return (
    <div className='flex flex-col flex-1 animate-pulse'>
      <div className='w-1/3 mb-2 sm:w-1/4 skeleton sm:skeleton--large'></div>
      <div className='w-1/5 skeleton animation-delay-200'></div>

      <div className='flex flex-col flex-1 pt-12 sm:justify-center sm:pb-12 sm:pt-4'>
        <div className='w-10/12 mb-3 skeleton sm:skeleton--large'></div>
        <div className='w-5/12 skeleton sm:skeleton--large animation-delay-200'></div>
      </div>
    </div>
  )
}
