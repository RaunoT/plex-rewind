'use client'

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  CalendarDaysIcon,
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
                  className='rounded-sm px-1 uppercase outline-hidden focus:bg-neutral-800 data-placeholder:text-neutral-50 data-placeholder:italic data-[type="literal"]:text-neutral-50'
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
            <Calendar className='glass-sheet bg-neutral-200/20 p-4'>
              <div className='flex items-center justify-between gap-3 px-2'>
                <Button
                  slot='previous'
                  className='link-dark focus-visible:focus-ring rounded-full p-1'
                >
                  <ArrowLeftCircleIcon className='size-5' />
                </Button>
                <Heading className='text-white' />
                <Button
                  slot='next'
                  className='link-dark focus-visible:focus-ring rounded-full p-1'
                >
                  <ArrowRightCircleIcon className='size-5' />
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
                            : 'hover:bg-neutral-500',
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
