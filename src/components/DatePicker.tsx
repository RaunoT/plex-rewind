'use client'

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  CalendarDaysIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { CalendarDate, parseDate } from '@internationalized/date'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
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
  I18nProvider,
  Label,
  Popover,
} from 'react-aria-components'

type Props = {
  label: string
  helperText?: string
  name: string
  defaultValue?: string
  required?: boolean
}

export default function DatePicker({
  label,
  helperText,
  name,
  defaultValue,
  required,
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [value, setValue] = useState<CalendarDate | null>(
    defaultValue ? parseDate(defaultValue) : null,
  )
  const t = useTranslations('DatePicker')

  return (
    <AriaDatePicker
      value={value}
      isOpen={isOpen}
      onChange={setValue}
      onOpenChange={setIsOpen}
      className='input-wrapper'
      name={name}
      isRequired={required}
    >
      <Group className='select-wrapper flex cursor-pointer'>
        <div
          className={clsx(
            'input select-input focus-within:focus-ring !bg-none',
            isOpen && 'focus-ring bg-neutral-400',
          )}
          onClick={() => setIsOpen(true)}
        >
          <I18nProvider locale='en-GB'>
            <DateInput className='flex w-fit cursor-auto'>
              {(segment) => (
                <DateSegment
                  segment={segment}
                  className='rounded px-1 uppercase outline-none focus-within:bg-neutral-500 data-[placeholder]:text-neutral-300 data-[type="literal"]:text-neutral-300'
                />
              )}
            </DateInput>
          </I18nProvider>
          {value && (
            <Button
              onPress={() => {
                setValue(null)
                setIsOpen(false)
              }}
              aria-label={t('clear')}
              className='link-dark absolute inset-y-0 right-14 my-auto'
            >
              <XCircleIcon className='size-6 text-neutral-300' />
            </Button>
          )}
          <CalendarDaysIcon className='absolute inset-y-0 right-3.5 my-auto size-5 text-neutral-300' />
        </div>
      </Group>
      <Label className={clsx('label', isOpen && 'text-white')}>
        <span className={clsx('label-wrapper', required && 'required')}>
          {label}
        </span>{' '}
        {helperText && <small>{helperText}</small>}
      </Label>
      <Popover>
        <Dialog>
          <Calendar className='glass-sheet bg-neutral-200/20 p-4'>
            <div className='flex items-center justify-between gap-3 px-2'>
              <Button slot='previous' className='link-dark'>
                <ArrowLeftCircleIcon className='size-5' />
              </Button>
              <Heading className='text-white' />
              <Button slot='next' className='link-dark'>
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
