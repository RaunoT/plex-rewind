export default function Loading() {
  return (
    <div className='flex flex-1 animate-pulse flex-col'>
      <div className='skeleton sm:skeleton--large mb-2 w-1/3 sm:w-1/4'></div>
      <div className='skeleton animation-delay-200 w-1/5'></div>

      <div className='flex flex-1 flex-col pt-12 sm:justify-center sm:pb-12 sm:pt-4'>
        <div className='skeleton sm:skeleton--large mb-3 w-10/12'></div>
        <div className='skeleton sm:skeleton--large animation-delay-200 w-5/12'></div>
      </div>
    </div>
  )
}
