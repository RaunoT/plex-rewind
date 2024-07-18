export default function Loading() {
  return (
    <div className='flex flex-1 animate-pulse flex-col'>
      <div className='mb-1 flex items-center'>
        <div className='skeleton mr-2 size-8 stroke-1 sm:size-10'></div>
        <div className='skeleton w-48'></div>
      </div>
      <ul className='mb-1 flex h-5 flex-wrap items-center gap-2 text-xs italic sm:gap-3 sm:text-base lg:h-6'>
        <li className='icon-stat-wrapper'>
          <div className='skeleton p-2'></div>
          <div className='skeleton w-20'></div>
        </li>
        <li className='icon-stat-wrapper'>
          <div className='skeleton p-2'></div>
          <div className='skeleton w-20'></div>
        </li>
      </ul>

      <ul className='mt-4 grid gap-y-3 sm:mt-6 sm:gap-y-5 lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-8'>
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
      <div className='skeleton aspect-[2/3] w-20 flex-shrink-0 rounded-none 2xl:w-24'></div>
      <div className='w-full'>
        <h3 className='skeleton mb-2 w-2/3 sm:w-1/3'></h3>
        <ul className='flex flex-wrap items-center gap-2 text-xs italic sm:gap-3 sm:text-base'>
          <li className='icon-stat-wrapper'>
            <div className='skeleton p-2'></div>
            <div className='skeleton w-10'></div>
          </li>
          <li className='icon-stat-wrapper'>
            <div className='skeleton p-2'></div>
            <div className='skeleton w-10'></div>
          </li>
        </ul>
      </div>
    </li>
  )
}
