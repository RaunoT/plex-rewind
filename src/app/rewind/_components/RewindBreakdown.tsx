'use client'

import { MEDIA_ICONS } from '@/components/icons'
import { RewindBreakdownItem } from '@/utils/helpers'
import { useTranslations } from 'next-intl'
import ShareBar from './ShareBar'

type Props = {
  items: RewindBreakdownItem[]
}

const LABEL_KEYS = {
  show: 'shows',
  movie: 'movies',
  artist: 'audio',
} as const

export default function RewindBreakdown({ items }: Props) {
  const t = useTranslations('Rewind.Total')
  const hasServerShares = items.some((item) => item.serverShare !== null)

  return (
    <div className='mt-4 not-italic'>
      {hasServerShares && (
        <div className='mb-4 flex flex-wrap gap-x-4 text-base font-normal tracking-normal text-neutral-400'>
          <span className='flex items-center gap-1.5'>
            <span className='bg-plex size-2.5 rounded-full' />
            {t('you')}
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='size-2.5 rounded-full bg-white/30' />
            {t('allUsers')}
          </span>
        </div>
      )}

      <ul className='space-y-4 text-xl sm:text-2xl'>
        {items.map((item, index) => {
          const Icon = MEDIA_ICONS[item.type]

          return (
            <li key={item.type}>
              <div className='mb-2 flex flex-wrap items-baseline justify-between gap-x-4'>
                <span className='rewind-cat'>
                  {t(LABEL_KEYS[item.type])}
                  <Icon />
                </span>
                <span className='font-semibold'>{item.duration}</span>
              </div>
              <ShareBar
                share={item.share}
                label={t('you')}
                delay={index * 0.15}
                isUser
              />
              {item.serverShare !== null && (
                <ShareBar
                  share={item.serverShare}
                  label={t('allUsers')}
                  delay={index * 0.15 + 0.1}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
