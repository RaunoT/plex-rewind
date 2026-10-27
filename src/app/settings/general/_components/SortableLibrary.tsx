'use client'

import { TautulliLibrary } from '@/types/tautulli'
import {
  Bars2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { kebabCase } from 'lodash'
import { Reorder, useDragControls } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Checkbox } from 'react-aria-components'

type Props = {
  library: TautulliLibrary
  isFirst: boolean
  isLast: boolean
  onMove: (offset: -1 | 1) => void
  onDragEnd: () => void
}

export default function SortableLibrary({
  library,
  isFirst,
  isLast,
  onMove,
  onDragEnd,
}: Props) {
  const dragControls = useDragControls()
  const t = useTranslations('Settings.General')

  return (
    <Reorder.Item
      as='div'
      value={library}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      // The move buttons already reorder with the keyboard, so keep the row
      // itself out of the tab order.
      tabIndex={-1}
      className='flex items-center gap-1'
    >
      <div
        className='flex size-8 shrink-0 cursor-move touch-none items-center justify-center select-none sm:size-6'
        onPointerDown={(event) => dragControls.start(event)}
      >
        <Bars2Icon className='size-5' />
      </div>
      <Checkbox
        value={kebabCase(library.section_name)}
        className='checkbox-wrapper flex-1'
      >
        <div className='checkbox' aria-hidden='true'></div>
        {library.section_name}
      </Checkbox>
      <button
        type='button'
        className='link-light focus-visible:focus-ring ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg disabled:pointer-events-none disabled:opacity-30 sm:size-6'
        aria-label={t('moveUp', { name: library.section_name })}
        data-move={`${library.section_id}-up`}
        disabled={isFirst}
        onClick={() => onMove(-1)}
      >
        <ChevronUpIcon className='size-5' />
      </button>
      <button
        type='button'
        className='link-light focus-visible:focus-ring flex size-8 shrink-0 items-center justify-center rounded-lg disabled:pointer-events-none disabled:opacity-30 sm:size-6'
        aria-label={t('moveDown', { name: library.section_name })}
        data-move={`${library.section_id}-down`}
        disabled={isLast}
        onClick={() => onMove(1)}
      >
        <ChevronDownIcon className='size-5' />
      </button>
    </Reorder.Item>
  )
}
