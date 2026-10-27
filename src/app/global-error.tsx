'use client'

import '@/styles/globals.css'
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, LOCALES } from '@/utils/constants'
import {
  AbstractIntlMessages,
  NextIntlClientProvider,
  useTranslations,
} from 'next-intl'
import { useEffect, useState, useSyncExternalStore } from 'react'

type Props = {
  error: Error
  reset: () => void
}

// Other locales load on demand, so they don't add to every page's bundle.
const ENGLISH_MESSAGES: AbstractIntlMessages = {
  Error: {
    title: 'Uh oh. Something went wrong!',
    cta: 'Try again',
  },
}

function subscribe() {
  return () => {}
}

// The root layout, and with it the locale provider, is gone, so the locale
// cookie is read directly.
function getLocale() {
  const locale = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split('=')[1]

  return locale && LOCALES.includes(locale) ? locale : DEFAULT_LOCALE
}

function ErrorContent({ error, reset }: Props) {
  const t = useTranslations('Error')

  useEffect(() => {
    console.error('[APP] - ', error)
  }, [error])

  return (
    <main className='flex min-h-dvh flex-col justify-center px-4 text-center'>
      <h1 className='mb-4 text-3xl leading-tight sm:text-4xl'>{t('title')}</h1>
      <button className='link mx-auto w-fit' onClick={() => reset()}>
        {t('cta')}
      </button>
    </main>
  )
}

export default function GlobalError({ error, reset }: Props) {
  const locale = useSyncExternalStore(
    subscribe,
    getLocale,
    () => DEFAULT_LOCALE,
  )
  const [messages, setMessages] = useState(ENGLISH_MESSAGES)

  useEffect(() => {
    if (locale === 'en') {
      return
    }

    import(`../../messages/${locale}.json`)
      .then((module) => setMessages({ Error: module.default.Error }))
      .catch((importError) =>
        console.error('[APP] - Failed to load translations!', importError),
      )
  }, [locale])

  return (
    <html lang={locale}>
      <body className='h-full min-h-dvh bg-black text-white'>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ErrorContent error={error} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
