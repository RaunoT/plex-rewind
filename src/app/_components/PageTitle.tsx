import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link'

type Props = {
  title?: string
}

export default function PageTitle({ title }: Props) {
  return (
    <div className='mb-4 w-full'>
      <div className='relative text-center uppercase'>
        <Link
          href='/'
          className={clsx(
            'ml-5 block w-5 transition-transform hover:translate-x-0.5 hover:opacity-75',
            {
              'absolute left-0 top-1/2 my-auto -translate-y-1/2': title,
            },
          )}
        >
          <ArrowLeftIcon />
        </Link>
        {title && (
          <h1 className='text-xl font-bold sm:text-2xl xl:text-3xl'>{title}</h1>
        )}
      </div>
    </div>
  )
}
