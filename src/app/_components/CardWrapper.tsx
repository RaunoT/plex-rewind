import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function CardWrapper({ children, className }: Props) {
  return (
    <div className={clsx('glass-sheet flex w-full flex-1 flex-col', className)}>
      {children}
    </div>
  )
}
