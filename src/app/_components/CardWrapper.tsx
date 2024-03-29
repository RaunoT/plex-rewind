import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function CardWrapper({ children, className }: Props) {
  return (
    <div
      className={clsx(
        'flex w-full flex-1 flex-col rounded-3xl bg-neutral-200/20 p-4 backdrop-blur-lg sm:p-8 2xl:p-10',
        className,
      )}
    >
      {children}
    </div>
  )
}
