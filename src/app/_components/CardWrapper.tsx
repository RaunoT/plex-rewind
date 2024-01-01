import clsx from "clsx"

type Props = {
  children: React.ReactNode
  className?: string
}

export default function CardWrapper({ children, className }: Props) {
  return (
    <div className='relative'>
      <article
        className={clsx(
          "bg-gradient flex min-h-[75vh] w-full flex-col rounded-3xl px-6 pb-4 pt-6 sm:px-8 sm:pt-8",
          className,
        )}
      >
        {children}
      </article>
    </div>
  )
}
