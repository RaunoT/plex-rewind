'use client'

import Avatar from '@/components/Avatar'
import { MEDIA_ICONS, STAT_ICONS } from '@/components/icons'
import Rank from '@/components/MediaItem/Rank'
import { TopPerson } from '@/types/statsSource'
import { secondsToTime } from '@/utils/formatting'
import { slideDown } from '@/utils/motion'
import { motion } from 'motion/react'
import { useFormatter, useTranslations } from 'next-intl'
import { useId, useLayoutEffect, useRef, useState } from 'react'

type Props = {
  people: TopPerson[]
  // What the titles they're counted by are
  type: 'movie' | 'show'
  // Called when the full list of a person's titles opens, to pause the story
  onExpand?: () => void
}

type RowProps = Omit<Props, 'people'> & {
  person: TopPerson
  i: number
}

// The names that fit on a line before "and more"
const TOGETHER_NAMES = 2

// Ranked like the top movies, with the person's portrait as the poster
export default function TopPeople({ people, ...props }: Props) {
  return (
    <ol className='mt-4 flex flex-col text-white sm:mt-5'>
      {people.map((person, i) => (
        <PersonRow key={person.name} person={person} i={i} {...props} />
      ))}
    </ol>
  )
}

// How much of `text` fits in `lines` lines with `suffix` after it, cut at a
// word, or null when all of it fits. Measured on an unseen copy of `element`
// at its width, so what's shown never jumps.
function findCut(
  element: HTMLElement,
  text: string,
  suffix: string,
  lines: number,
): number | null {
  const copy = element.cloneNode() as HTMLElement
  const maxHeight = parseFloat(getComputedStyle(element).lineHeight) * lines

  copy.removeAttribute('id')
  copy.setAttribute('aria-hidden', 'true')
  Object.assign(copy.style, {
    position: 'absolute',
    visibility: 'hidden',
    width: `${element.clientWidth}px`,
  })
  element.after(copy)

  function fits(content: string) {
    copy.textContent = content

    // A pixel of slack for rounding
    return copy.offsetHeight <= maxHeight + 1
  }

  try {
    if (fits(text)) {
      return null
    }

    let low = 0
    let high = text.length

    while (low < high) {
      const middle = Math.ceil((low + high) / 2)

      if (fits(text.slice(0, middle) + suffix)) {
        low = middle
      } else {
        high = middle - 1
      }
    }

    const space = text.lastIndexOf(' ', low)

    return space > 0 ? space : low
  } finally {
    copy.remove()
  }
}

function PersonRow({ person, i, type, onExpand }: RowProps) {
  const translations = useTranslations()
  const t = useTranslations('Rewind.People')
  const format = useFormatter()
  const titlesId = useId()
  const titlesRef = useRef<HTMLParagraphElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [cutAt, setCutAt] = useState<number | null>(null)
  const TypeIcon = MEDIA_ICONS[type]
  const titles = format.list(person.titles, { type: 'unit' })
  const seeMore = t('seeMore')
  // A line shorter beside the names, so the row stays as tall as the portrait
  const lines = person.together.length ? 1 : 2

  // Before paint, so the full list never shows first. The cut changes with
  // the width the titles get, and once the font has loaded.
  useLayoutEffect(() => {
    const element = titlesRef.current

    if (!element) {
      return
    }

    let width = element.clientWidth
    let isActive = true

    function measure() {
      if (isActive && element) {
        setCutAt(findCut(element, titles, `… ${seeMore}`, lines))
      }
    }

    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth
        measure()
      }
    })

    measure()
    observer.observe(element)
    void document.fonts.ready.then(measure)

    return () => {
      isActive = false
      observer.disconnect()
    }
  }, [titles, seeMore, lines])

  // Only the top-billed are named, and the cast goes on past them, so the
  // list always ends in "and more" rather than a count.
  function formatTogether(names: string[]) {
    return t('together', {
      names: format.list([...names.slice(0, TOGETHER_NAMES), t('more')], {
        type: 'conjunction',
      }),
    })
  }

  function toggleTitles() {
    if (!isExpanded) {
      onExpand?.()
    }

    setIsExpanded(!isExpanded)
  }

  return (
    <motion.li
      className='flex items-center gap-3 py-2.5 not-first:border-t not-first:border-white/10 first:pt-0 last:pb-0 motion-reduce:transform-none! motion-reduce:opacity-100! sm:gap-4'
      variants={slideDown}
      initial='hidden'
      animate='show'
      transition={{ delay: i * 0.075 }}
    >
      {/* The portrait moves in by the rank badge's overhang on phones */}
      <div className='relative flex shrink-0 items-center gap-3 max-sm:pt-1 max-sm:pl-1 sm:gap-4'>
        <Rank rank={i} />
        <div className='poster max-sm:w-12'>
          <Avatar src={person.image} name={person.name} sizes='10rem' />
        </div>
      </div>
      <div className='min-w-0 flex-1'>
        <h2 className='truncate leading-snug font-medium sm:text-lg'>
          {person.name}
        </h2>
        {person.together.length > 0 && (
          <p className='truncate text-sm text-neutral-300'>
            {formatTogether(person.together)}
          </p>
        )}
        <p
          id={titlesId}
          ref={titlesRef}
          className='mb-2 text-sm text-neutral-400'
        >
          {isExpanded || cutAt === null
            ? titles
            : `${titles.slice(0, cutAt).replace(/[\s,]+$/, '')}…`}
          {cutAt !== null && (
            <>
              {' '}
              <button
                type='button'
                className='link underline decoration-white/30 underline-offset-2'
                aria-expanded={isExpanded}
                aria-controls={titlesId}
                onClick={toggleTitles}
              >
                {isExpanded ? t('seeLess') : seeMore}
              </button>
            </>
          )}
        </p>
        <ul className='icon-stats-container'>
          <li className='icon-stat-wrapper'>
            <TypeIcon />
            {t(type === 'movie' ? 'movies' : 'shows', {
              count: person.count,
            })}
          </li>
          <li className='icon-stat-wrapper'>
            <STAT_ICONS.duration />
            {secondsToTime(person.duration, translations)}
          </li>
        </ul>
      </div>
    </motion.li>
  )
}
