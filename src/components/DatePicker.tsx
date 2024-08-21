'use client'

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline'
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
  Text,
} from 'react-aria-components'

type Props = {
  label: string
  helperText?: string
}

export default function DatePicker({ label, helperText }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AriaDatePicker
      className='input-wrapper'
      onOpenChange={setIsOpen}
      isOpen={isOpen}
    >
      <Group
        className='input select-wrapper flex cursor-pointer uppercase'
        onClick={() => setIsOpen(true)}
      >
        <DateInput className='flex cursor-auto'>
          {(segment) => (
            <DateSegment
              segment={segment}
              className='mx-1 first:ml-0 last:mr-0'
            />
          )}
        </DateInput>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='#D4D4D4'
          className='ml-auto size-6'
        >
          <path d='M7 10l5 5 5-5z' />
        </svg>
      </Group>
      <Label className='label'>
        {label} {helperText && <small>{helperText}</small>}
      </Label>
      <Popover onOpenChange={setIsOpen}>
        <Dialog>
          <Calendar className='min-w-[14rem] rounded-xl bg-neutral-500 p-4'>
            <div className='flex items-center justify-between gap-4 text-neutral-300'>
              <Button slot='previous'>
                <ArrowLeftCircleIcon className='size-5' />
              </Button>
              <Heading />
              <Button slot='next'>
                <ArrowRightCircleIcon className='size-5' />
              </Button>
            </div>
            <CalendarGrid className='mx-auto'>
              <CalendarGridHeader>
                {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className='flex size-8 items-center justify-center rounded-full hover:bg-neutral-400'
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
            <Text slot='errorMessage' />
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  )
}
