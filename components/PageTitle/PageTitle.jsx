import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import React from 'react'

function PageTitle({ title, subtitle }) {
  return (
    <div className="relative w-full mb-4 text-center uppercase min-h-[">
      <Link
        href="/"
        className={`w-5 block ml-5 ${
          title ? 'absolute my-auto -translate-y-1/2 left-0 top-1/2' : ''
        }`}
      >
        <ArrowLeftIcon />
      </Link>
      {title && <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>}
      {subtitle && (
        <span className="block text-xs font-medium text-teal-300 sm:text-sm">
          {subtitle}
        </span>
      )}
    </div>
  )
}

export default PageTitle
