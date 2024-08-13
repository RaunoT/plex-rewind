'use client'

import { Settings } from '@/types/settings'
import { SETTINGS_PAGES } from '@/utils/constants'
import { checkRequiredSettings } from '@/utils/helpers'
import { ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useFormState } from 'react-dom'
import SettingsSaveButton from './SettingsSaveButton'

type Props = {
  children: ReactNode
  settings: Settings
  // TODO: define action type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any
  hideSubmit?: boolean
  settingKey: keyof Settings
}

function getNextSettingsPage(currentPath: string): string | undefined {
  const currentIndex = SETTINGS_PAGES.findIndex(
    (page) => page.href === currentPath,
  )

  return currentIndex === -1 || currentIndex === SETTINGS_PAGES.length - 1
    ? undefined
    : SETTINGS_PAGES[currentIndex + 1].href
}

export default function SettingsForm({
  children,
  settings,
  action,
  hideSubmit,
  settingKey,
}: Props) {
  const initialState = {
    message: '',
    status: '',
    fields: settings,
  }
  const [formState, formAction] = useFormState(action, initialState)
  const allowContinue = settings[settingKey].complete
  const pathname = usePathname()
  const nextPage = getNextSettingsPage(pathname)
  const missingSetting = checkRequiredSettings(settings)

  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
        {children}
        {!hideSubmit && (
          <div className='flex flex-col items-center justify-end gap-2 sm:flex-row sm:gap-4'>
            <p
              aria-live='polite'
              role='status'
              className={
                formState.status === 'success'
                  ? 'text-green-600'
                  : 'text-red-500'
              }
            >
              {formState.message}
            </p>

            <SettingsSaveButton />
            {nextPage && missingSetting && (
              <Link
                href={nextPage}
                className='button -ml-2 px-2 aria-disabled:pointer-events-none aria-disabled:opacity-50'
                aria-disabled={!allowContinue}
              >
                <ChevronDoubleRightIcon className='size-6' />
              </Link>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
