'use client'

import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { CalendarDate, parseDate } from '@internationalized/date'
import clsx from 'clsx'
import { useLocale, useTranslations } from 'next-intl'
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
  const locale = useLocale()
  const t = useTranslations('DatePicker')

  return (
    <I18nProvider locale={locale === 'en' ? 'en-GB' : locale}>
      <AriaDatePicker
        value={value}
        isOpen={isOpen}
        onChange={setValue}
        onOpenChange={setIsOpen}
        className='input-wrapper'
        name={name}
        isRequired={required}
      >
        <Group className='select-wrapper flex'>
          <div
            className={clsx(
              'input select-input focus-within:focus-ring bg-none!',
              isOpen && 'focus-ring',
            )}
          >
            <DateInput className='flex w-fit cursor-auto'>
              {(segment) => (
                <DateSegment
                  segment={segment}
                  className='rounded-sm px-1 uppercase outline-hidden focus:bg-white/15 data-placeholder:text-neutral-400 data-[type="literal"]:text-neutral-400'
                />
              )}
            </DateInput>
            {value && (
              <Button
                slot={null}
                onPress={() => setValue(null)}
                aria-label={t('clear')}
                className='link-dark focus-visible:focus-ring absolute inset-y-0 right-14 my-auto size-6 rounded-full'
              >
                <XCircleIcon className='size-6 text-neutral-300' />
              </Button>
            )}
            <Button
              aria-label={t('open')}
              className='link-dark focus-visible:focus-ring absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl'
            >
              <CalendarDaysIcon className='size-5 text-neutral-300' />
            </Button>
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
            <Calendar className='glass-sheet bg-neutral-900/80'>
              <div className='flex items-center justify-between gap-3 px-2'>
                <Button slot='previous' className='icon-button'>
                  <ChevronLeftIcon />
                </Button>
                <Heading className='text-white' />
                <Button slot='next' className='icon-button'>
                  <ChevronRightIcon />
                </Button>
              </div>
              <CalendarGrid className='mt-2'>
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className='text-xs text-neutral-300'>
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
                          'm-px flex size-8 items-center justify-center rounded-full outline-hidden',
                          state.isSelected
                            ? 'bg-white font-semibold text-black hover:bg-neutral-200'
                            : 'hover:bg-white/10',
                          state.isToday &&
                            !state.isSelected &&
                            'ring-1 ring-neutral-300 ring-inset',
                          state.isFocusVisible &&
                            clsx(
                              'ring-2 ring-inset',
                              state.isSelected
                                ? 'ring-neutral-800'
                                : 'ring-neutral-200',
                            ),
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
    </I18nProvider>
  )
}
