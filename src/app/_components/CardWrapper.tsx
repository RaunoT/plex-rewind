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
          'bg-gradient-card flex w-full flex-col rounded-3xl px-6 pb-4 pt-6 sm:px-8 sm:pt-8',
          className,
        )}
      >
        {children}
      </article>
    </div>
  )
}
