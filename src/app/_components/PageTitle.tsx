import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link'

type Props = {
  title?: string
  noBack?: boolean
}

export default function PageTitle({ title, noBack }: Props) {
  return (
    <div className='mb-3 w-full 2xl:mb-4'>
      <div className='relative text-center uppercase'>
        {!noBack && (
          <Link
            href='/'
            className={clsx(
              'link-light ml-5 block w-5 transition-transform hover:translate-x-0.5 aria-disabled:pointer-events-none aria-disabled:opacity-75',
              {
                'absolute left-0 top-1/2 my-auto -translate-y-1/2': title,
              },
            )}
          >
            <ArrowLeftIcon />
          </Link>
        )}
        {title && (
          <h1 className='text-xl font-bold sm:text-2xl 2xl:text-3xl'>
            {title}
          </h1>
        )}
      </div>
    </div>
  )
}
