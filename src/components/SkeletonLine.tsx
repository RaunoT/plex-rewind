import clsx from 'clsx'

type Props = {
  className?: string
  width?: string
}

// As tall as a line of the surrounding text, so swapping in the real text
// doesn't move anything
export default function SkeletonLine({ className, width = 'w-full' }: Props) {
  return (
    <div className={clsx('flex h-[1lh] items-center', className)}>
      <div className={clsx('skeleton h-[0.7em]', width)} />
    </div>
  )
}
