export default function Loading() {
  return (
    <div className='flex flex-1 animate-pulse flex-col'>
      <div className='flex flex-1 flex-col pt-12 sm:justify-center sm:pb-12 sm:pt-4'>
        <div className='skeleton sm:skeleton--large mb-3 w-10/12'></div>
        <div className='skeleton sm:skeleton--large w-5/12 animation-delay-300'></div>
      </div>
    </div>
  )
}
