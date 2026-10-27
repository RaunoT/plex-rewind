'use client'

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import {
  Button,
  Text,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion,
} from 'react-aria-components'

type ToastMessage = {
  message: string
  status: 'success' | 'error'
}

export const toastQueue = new ToastQueue<ToastMessage>({ maxVisibleToasts: 3 })

// Rendered once in the app, and announced to screen readers as they appear
export default function Toasts() {
  const t = useTranslations('Common')

  return (
    <ToastRegion
      queue={toastQueue}
      className='fixed inset-x-4 top-4 z-50 flex flex-col items-center gap-2 outline-none sm:inset-x-auto sm:right-4 sm:items-end'
    >
      {({ toast }) => (
        <Toast
          toast={toast}
          className='glass animate-fade-in focus-visible:focus-ring flex w-full max-w-sm items-center gap-3 rounded-2xl py-2 pr-2 pl-4 text-sm outline-none sm:w-auto'
        >
          {toast.content.status === 'success' ? (
            <CheckCircleIcon className='text-success size-5 shrink-0' />
          ) : (
            <ExclamationCircleIcon className='text-danger size-5 shrink-0' />
          )}
          <ToastContent className='min-w-0 flex-1'>
            <Text slot='title'>{toast.content.message}</Text>
          </ToastContent>
          <Button
            slot='close'
            aria-label={t('dismiss')}
            className='icon-button'
          >
            <XMarkIcon className='size-4!' />
          </Button>
        </Toast>
      )}
    </ToastRegion>
  )
}
