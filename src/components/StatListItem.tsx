import clsx from 'clsx'

type Props = {
  count: number
  name: string
  icon: React.ReactNode
  separator?: string
}

export default function StatListItem({
  count,
  name,
  icon,
  separator = '•',
}: Props) {
  return (
    <li className='my-2 last:my-0'>
      <span className='font-semibold text-black'>
        {count.toLocaleString('en-US')}
      </span>
      <span
        className={clsx(
          'mx-2',
          separator === '•' ? 'text-black' : 'text-white'
        )}
      >
        {separator}
      </span>
      <span className='inline-flex items-center text-teal-300'>
        {name}
        {icon}
      </span>
    </li>
  )
}
