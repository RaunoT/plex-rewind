import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'

export default function PageTitle({ title }) {
  return (
    <div className="w-full mb-2">
      <div className="relative text-center uppercase">
        <Link
          href="/"
          className={clsx('w-5 block ml-5', {
            'absolute my-auto -translate-y-1/2 left-0 top-1/2': title,
          })}
        >
          <ArrowLeftIcon />
        </Link>
        {title && <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>}
      </div>
      <ul className="flex items-center text-teal-300 font-medium gap-4 mt-3 justify-center text-xs sm:text-base">
        <li>
          <button className="uppercase">30 days</button>
        </li>
        <li>
          <button className="uppercase text-white">3 months</button>
        </li>
        <li>
          <button className="uppercase text-white">This year</button>
        </li>
        <li>
          <button className="uppercase text-white">All time</button>
        </li>
      </ul>
    </div>
  )
}
