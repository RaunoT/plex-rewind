import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function CardWrapper({ children, className }: Props) {
  return (
    <div className='relative'>
      <article
        className={clsx(
          'bg-gradient flex w-full flex-col rounded-3xl px-6 pb-3 pt-8 sm:px-8 sm:pb-5',
          className,
        )}
      >
        {children}
      </article>
    </div>
  )
}
