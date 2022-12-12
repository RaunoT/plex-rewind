import { ArrowLeftIcon } from '@heroicons/react/24/solid'

function DashboardTitle({ returnHome }) {
  return (
    <div className="relative w-full max-w-2xl mb-4 text-center uppercase">
      <button
        onClick={returnHome}
        className="absolute w-5 my-auto -translate-y-1/2 left-5 top-1/2"
      >
        <ArrowLeftIcon />
      </button>
      <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
      <span className="block text-xs font-medium text-teal-300 sm:text-sm">
        last 30 days
      </span>
    </div>
  )
}

export default DashboardTitle
