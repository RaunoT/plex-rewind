import { useLocale } from 'next-intl'
import { ReactNode } from 'react'

type Props = {
  count: number
  name: string
  icon: ReactNode
  separator?: string
  library?: string
}

export default function StatListItem({ count, name, icon, library }: Props) {
  const locale = useLocale()

  return (
    <li className='my-2 last:my-0'>
      {library && (
        <div className='mb-1 text-base text-neutral-400 lg:text-lg'>
          {library}
        </div>
      )}
      <span className='font-semibold'>{count.toLocaleString(locale)}</span>
      <span className='mx-2 text-neutral-600'>•</span>
      <span className='rewind-cat'>
        {name}
        {icon}
      </span>
    </li>
  )
}
