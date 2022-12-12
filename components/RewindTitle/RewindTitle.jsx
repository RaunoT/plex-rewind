import { ArrowLeftIcon } from '@heroicons/react/24/solid'

function RewindTitle({ returnHome }) {
  return (
    <div className="w-full max-w-2xl mb-4">
      <button onClick={returnHome} className="block w-5 ml-5">
        <ArrowLeftIcon />
      </button>
    </div>
  )
}

export default RewindTitle
