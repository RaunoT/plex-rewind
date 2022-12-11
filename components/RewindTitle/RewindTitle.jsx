import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

function RewindTitle() {
  return (
    <div className="w-full max-w-2xl mb-4">
      <Link href="/" className="block w-5 ml-5">
        <ArrowLeftIcon />
      </Link>
    </div>
  )
}

export default RewindTitle
