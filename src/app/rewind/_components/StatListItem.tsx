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
        <div className='gradient-plex mb-1 text-base lg:text-lg'>{library}</div>
      )}
      <span className='font-semibold'>{count.toLocaleString('en-US')}</span>
      <span
        className={clsx(
          'mx-2',
          separator === '•' ? 'gradient-rewind' : 'text-white',
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
