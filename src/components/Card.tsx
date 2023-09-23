import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className }: Props) {
  return (
    <div className='relative'>
      <article
        className={clsx(
          'px-6 sm:px-8 pt-8 pb-3 sm:pb-5 rounded-3xl w-full flex flex-col bg-gradient',
          className
        )}
      >
        {children}
      </article>
    </div>
  )
}
