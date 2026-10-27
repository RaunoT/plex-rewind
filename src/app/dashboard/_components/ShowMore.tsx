'use client'

import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import Link, { useLinkStatus } from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type Props = {
  limit: number
}

// Replaces the URL, so Back leaves the dashboard instead of shortening the list
export default function ShowMore({ limit }: Props) {
  const t = useTranslations('Dashboard')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())

  params.set('limit', String(limit))

  return (
    <Link
      href={`${pathname}?${params.toString()}`}
      className='show-more'
      scroll={false}
      replace
    >
      <ShowMoreIcon />
      {t('showMore')}
    </Link>
  )
}

function ShowMoreIcon() {
  const { pending } = useLinkStatus()

  return pending ? (
    <ArrowPathIcon className='motion-safe:animate-spin' />
  ) : (
    <ChevronDownIcon />
  )
}
