import clsx from 'clsx'

export default function StatListItem({
  count,
  name,
  icon,
  separator = '•',
  ...props
}) {
  return (
    <li className='my-2 last:my-0' {...props}>
      <span className='font-semibold text-black'>
        {parseInt(count).toLocaleString('en-US')}
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
