import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

function DashboardTitle() {
  return (
    <div className="relative w-full max-w-2xl">
      <Link
        href="/"
        className="absolute w-5 my-auto -translate-y-1/2 left-5 top-1/2"
      >
        <ArrowLeftIcon />
      </Link>
      <h1 className="mb-4 text-xl font-bold text-center uppercase sm:text-2xl">
        Dashboard
        <span className="block text-xs font-medium text-teal-300 sm:text-sm">
          last 30 days
        </span>
      </h1>
    </div>
  )
}

export default DashboardTitle
