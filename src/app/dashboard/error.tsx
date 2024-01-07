'use client'

import { useEffect } from 'react'

type Props = {
  error: Error
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className='flex flex-1 flex-col justify-center text-center lg:min-h-[492px] 2xl:min-h-[564px]'>
      <h1 className='mb-4 text-3xl italic leading-tight sm:text-4xl'>
        Uh oh.. something went wrong!
      </h1>
      <button className='link link--dark mx-auto w-fit' onClick={() => reset()}>
        Try again
      </button>
    </div>
  )
}
