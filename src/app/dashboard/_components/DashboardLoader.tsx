export default function DashboardLoader() {
  return (
    <div className='flex flex-1 animate-pulse flex-col'>
      <div className='mb-2.5 h-8 sm:mb-1 sm:h-10 lg:mb-1.5'>
        <div className='mt-1 flex items-center sm:mt-0'>
          <div className='skeleton ml-0.5 mr-2 size-6 p-0 sm:-mt-0.5 sm:ml-0 sm:size-8'></div>
          <div className='skeleton w-32 sm:w-48'></div>
        </div>
      </div>
      <ul className='icon-stats-container mb-1.5 sm:gap-x-3 lg:mb-2'>
        <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
          <div className='skeleton size-4 p-0'></div>
          <div className='skeleton w-20'></div>
        </li>
        <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
          <div className='skeleton size-4 p-0'></div>
          <div className='skeleton w-20'></div>
        </li>
      </ul>

      <ul className='mt-4 flex flex-col gap-y-3 overflow-hidden sm:mt-6 sm:gap-y-5 lg:grid lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-8'>
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
    <li className='flex gap-3 last:hidden lg:last:flex'>
      <div className='skeleton aspect-[2/3] w-20 shrink-0 rounded-none sm:w-[5.35rem] 2xl:w-24'></div>
      <div className='mt-1 w-full sm:mt-2 2xl:mt-[2.125rem]'>
        <div className='skeleton mb-3 w-2/3 sm:w-1/3'></div>
        <ul className='icon-stats-container'>
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            <div className='skeleton size-4 p-0'></div>
            <div className='skeleton w-10'></div>
          </li>
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            <div className='skeleton size-4 p-0'></div>
            <div className='skeleton w-10'></div>
          </li>
        </ul>
      </div>
    </li>
  )
}
