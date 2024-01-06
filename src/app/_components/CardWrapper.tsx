import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function CardWrapper({ children, className }: Props) {
  return (
    <div className='relative flex flex-1 lg:block'>
      <article
        className={clsx(
          'flex w-full flex-col rounded-3xl bg-teal-900 px-6 py-6 sm:p-8 lg:p-10',
          className,
        )}
      >
        {children}
      </article>
    </div>
  )
}
