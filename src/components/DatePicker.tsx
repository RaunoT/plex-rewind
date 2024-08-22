'use client'

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { CalendarDate } from '@internationalized/date'
import clsx from 'clsx'
import { useState } from 'react'
import {
  DatePicker as AriaDatePicker,
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
} from 'react-aria-components'

type Props = {
  label: string
  helperText?: string
}

export default function DatePicker({ label, helperText }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState<CalendarDate | null>(null)

  return (
    <AriaDatePicker
      value={value}
      isOpen={isOpen}
      onChange={setValue}
      onOpenChange={setIsOpen}
      className='input-wrapper'
    >
      <Group className='select-wrapper flex cursor-pointer'>
        <div className='select-input input' onClick={() => setIsOpen(true)}>
          <DateInput className='flex w-fit cursor-auto'>
            {(segment) => (
              <DateSegment
                segment={segment}
                className='mx-1 uppercase outline-none first:ml-0 last:mr-0 data-[type="literal"]:text-neutral-300'
              />
            )}
          </DateInput>
        </div>
        {value && (
          <Button
            onPress={() => setValue(null)}
            aria-label='Clear date'
            className='absolute inset-y-0 right-14 my-auto'
          >
            <XCircleIcon className='size-6 text-neutral-300' />
          </Button>
        )}
      </Group>
      <Label className='label'>
        {label} {helperText && <small>{helperText}</small>}
      </Label>
      <Popover onOpenChange={setIsOpen}>
        <Dialog>
          <Calendar className='glass-sheet bg-neutral-200/20 p-4'>
            <div className='flex items-center justify-between gap-3 px-2'>
              <Button slot='previous' className='link-light'>
                <ArrowLeftCircleIcon className='size-5' />
              </Button>
              <Heading className='text-white' />
              <Button slot='next' className='link-light'>
                <ArrowRightCircleIcon className='size-5' />
              </Button>
            </div>
            <CalendarGrid className='mt-2'>
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className='text-xs text-neutral-400'>
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={(state) =>
                      clsx(
                        'm-px flex size-8 items-center justify-center rounded-full hover:bg-neutral-400 focus:bg-neutral-400 focus:outline-none',
                        state.isOutsideMonth && 'hidden',
                      )
                    }
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  )
}
