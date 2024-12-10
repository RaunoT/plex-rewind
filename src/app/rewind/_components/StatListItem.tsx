import { ReactNode } from 'react'

type Props = {
  count: number
  name: string
  icon: ReactNode
  separator?: string
  library?: string
}

export default function StatListItem({ count, name, icon, library }: Props) {
  return (
    <li className='my-2 last:my-0'>
      {library && (
        <div className='gradient-plex mb-1 text-base lg:text-lg'>{library}</div>
      )}
      <span className='font-semibold'>{count.toLocaleString('en-US')}</span>
      {/* eslint-disable-next-line react/jsx-no-literals */}
      <span className='gradient-rewind mx-2'>•</span>
      <span className='rewind-cat'>
        {name}
        {icon}
      </span>
    </li>
  )
}
