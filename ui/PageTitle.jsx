import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link'

export default function PageTitle({ title }) {
  return (
    <div className='w-full mb-4'>
      <div className='relative text-center uppercase'>
        <Link
          href='/'
          className={clsx('w-5 block ml-5', {
            'absolute my-auto -translate-y-1/2 left-0 top-1/2': title,
          })}
        >
          <ArrowLeftIcon />
        </Link>
        {title && <h1 className='text-xl font-bold sm:text-2xl'>{title}</h1>}
      </div>
    </div>
  )
}
