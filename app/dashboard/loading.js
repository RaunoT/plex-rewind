export default function Loading() {
  return (
    <div className="flex flex-col flex-1 animate-pulse">
      <div className="w-1/3 mb-2 sm:w-1/4 skeleton sm:skeleton--large"></div>
      <div className="w-1/5 skeleton animation-delay-200"></div>

      <ul className="grid mt-4 xl:grid-cols-2 xl:grid-rows-3 sm:mt-6 xl:gap-x-8 gap-y-3 sm:gap-y-5">
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
    <li className="flex items-center gap-3">
      <div className="flex-shrink-0 w-20 rounded-none aspect-[2/3] skeleton"></div>
      <div className="w-full">
        <h3 className="w-2/3 mb-2 sm:w-1/3 skeleton"></h3>
        <ul className="flex flex-wrap items-center gap-2 text-xs italic sm:gap-3 sm:text-base">
          <li className="flex items-center gap-1 sm:gap-2">
            <div className="p-2 skeleton"></div>
            <div className="w-10 skeleton"></div>
          </li>
          <li className="flex items-center gap-1 sm:gap-2">
            <div className="p-2 skeleton"></div>
            <div className="w-10 skeleton"></div>
          </li>
        </ul>
      </div>
    </li>
  )
}
