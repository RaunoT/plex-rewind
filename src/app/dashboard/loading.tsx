export default function Loading() {
  return (
    <div className='flex flex-1 animate-pulse flex-col'>
      <div className='skeleton sm:skeleton--large mb-2 w-2/3 sm:w-1/4'></div>
      <div className='skeleton animation-delay-300 w-2/5 sm:w-1/5'></div>

      <ul className='mt-4 grid gap-y-3 pb-10 sm:mt-6 sm:gap-y-5 lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-8'>
        <ListItem />
        <ListItem />
        <ListItem />
        <ListItem />
        <ListItem />
        <ListItem />
      </ul>
    </div>
  )
}

function ListItem() {
  return (
    <li className='flex items-center gap-3 last:hidden lg:last:flex'>
      <div className='skeleton aspect-[2/3] w-20 flex-shrink-0 rounded-none'></div>
      <div className='w-full'>
        <h3 className='skeleton mb-2 w-2/3 sm:w-1/3'></h3>
        <ul className='flex flex-wrap items-center gap-2 text-xs italic sm:gap-3 sm:text-base'>
          <li className='flex items-center gap-1 sm:gap-2'>
            <div className='skeleton p-2'></div>
            <div className='skeleton w-10'></div>
          </li>
          <li className='flex items-center gap-1 sm:gap-2'>
            <div className='skeleton p-2'></div>
            <div className='skeleton w-10'></div>
          </li>
        </ul>
      </div>
    </li>
  )
}
