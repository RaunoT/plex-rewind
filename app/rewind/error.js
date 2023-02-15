'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className='flex flex-col justify-center flex-1 text-center'>
      <h1 className='mb-4 text-3xl italic leading-tight sm:text-4xl last:mb-0'>
        Uh oh.. something went wrong!
      </h1>
      <button
        className='text-slate-300 hover:opacity-75'
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}
