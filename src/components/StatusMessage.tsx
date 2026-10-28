import clsx from 'clsx'
import { ComponentType, ReactNode, SVGProps } from 'react'

type Props = {
  // Says at a glance what kind of message it is
  icon: ComponentType<SVGProps<SVGSVGElement>>
  // Without one, the description says it all
  title?: string
  description?: ReactNode
  action?: ReactNode
  // Only one h1 per page, so pages with their own title pass h2
  as?: 'h1' | 'h2' | 'h3'
  // Already inside a card, so it doesn't draw one of its own
  isInCard?: boolean
}

// Error, empty and offline states share this, so they all read the same way
export default function StatusMessage({
  icon: Icon,
  title,
  description,
  action,
  as: Heading = 'h2',
  isInCard,
}: Props) {
  return (
    <div className='flex w-full flex-1 flex-col items-center justify-center'>
      <div
        className={clsx(
          'flex w-full max-w-sm flex-col items-center text-center',
          !isInCard && 'glass-sheet animate-fade-in',
        )}
      >
        <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-white/5 text-neutral-300 ring-1 ring-white/10 ring-inset'>
          <Icon className='size-6' aria-hidden='true' />
        </div>
        {title && (
          <Heading className='text-2xl font-semibold tracking-tight'>
            {title}
          </Heading>
        )}
        {description && (
          <p className={clsx('text-neutral-300', title && 'mt-2')}>
            {description}
          </p>
        )}
        {action && (
          <div className='mt-8 flex w-full flex-col items-center gap-3'>
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
