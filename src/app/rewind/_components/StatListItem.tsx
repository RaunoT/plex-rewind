import clsx from 'clsx'
import { ReactNode } from 'react'

type Props = {
  count: number
  name: string
  icon: ReactNode
  separator?: string
  library?: string
}

export default function StatListItem({
  count,
  name,
  icon,
  separator = '•',
  library,
}: Props) {
  return (
    <li className='my-2 last:my-0'>
      {library && (
        <div className='mb-1 text-base text-black lg:text-lg'>{library}</div>
      )}
      <span className='font-semibold text-black'>
        {count.toLocaleString('en-US')}
      </span>
      <span
        className={clsx(
          'mx-2',
          separator === '•' ? 'text-black' : 'text-white',
        )}
      >
        {separator}
      </span>
      <span className='rewind-cat'>
        {name}
        {icon}
      </span>
    </li>
  )
}
