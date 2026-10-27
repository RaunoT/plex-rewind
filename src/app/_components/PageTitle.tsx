import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode } from 'react'
import HeaderControls from './HeaderControls'

type Props = {
  title?: string
  // Kept for screen readers only
  isTitleHidden?: boolean
  noBack?: boolean
  // When the sidebar already lists the same links, the page doesn't repeat them
  isNavInSidebar?: boolean
  // Stands in for the title, and the navigation below it, on narrow screens
  titleMenu?: ReactNode
  // Page navigation, shown in the header row when it fits and below it when not
  children?: ReactNode
}

// The sidebar shows where you are and holds the controls on large screens
const hiddenWithSidebar = 'lg:group-data-[sidebar]/app:hidden'

export default function PageTitle({
  title,
  isTitleHidden,
  noBack,
  isNavInSidebar,
  titleMenu,
  children,
}: Props) {
  const t = useTranslations('Home')
  const hasVisibleNavWithSidebar = children && !isNavInSidebar

  return (
    <header
      data-page-header
      className={clsx(
        '@container mb-4 w-full',
        !hasVisibleNavWithSidebar && 'lg:group-data-[sidebar]/app:mb-0',
      )}
    >
      <div className='grid grid-cols-[1fr_auto] items-center gap-3 lg:group-data-[sidebar]/app:gap-y-0 @4xl:grid-cols-[1fr_auto_1fr]'>
        <div className='flex min-w-0 items-center gap-3'>
          {!noBack && (
            <Link
              href='/'
              aria-label={t('title')}
              className={clsx(
                'icon-button icon-button--glass group',
                hiddenWithSidebar,
              )}
            >
              <ArrowLeftIcon className='size-5 transition-transform group-hover:-translate-x-0.5' />
            </Link>
          )}
          {title && (
            <h1
              className={clsx(
                'truncate text-lg font-semibold tracking-tight sm:text-xl lg:group-data-[sidebar]/app:sr-only',
                titleMenu && 'max-lg:sr-only',
                isTitleHidden && 'sr-only',
              )}
            >
              {title}
            </h1>
          )}
          {titleMenu && <div className='min-w-0 lg:hidden'>{titleMenu}</div>}
        </div>
        <HeaderControls
          className={clsx(
            'col-start-2 row-start-1 justify-self-end @4xl:col-start-3',
            hiddenWithSidebar,
          )}
        />
        {children && (
          <div
            className={clsx(
              'col-span-2 row-start-2 min-w-0 @4xl:col-span-1 @4xl:col-start-2 @4xl:row-start-1',
              isNavInSidebar && hiddenWithSidebar,
              titleMenu && 'max-lg:hidden',
            )}
          >
            {children}
          </div>
        )}
      </div>
    </header>
  )
}
