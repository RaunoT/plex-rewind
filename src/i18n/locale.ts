'use server'

import {
  DEFAULT_LOCALE,
  Locale,
  LOCALE_COOKIE_NAME,
  LOCALES,
} from '@/utils/constants'
import { cookies } from 'next/headers'

export async function getUserLocale() {
  const cookieStore = cookies()

  return LOCALES.includes(cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale)
    ? cookieStore.get(LOCALE_COOKIE_NAME)?.value
    : DEFAULT_LOCALE
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = cookies()

  cookieStore.set(LOCALE_COOKIE_NAME, locale)
}
