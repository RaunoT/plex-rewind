'use server'

import {
  DEFAULT_LOCALE,
  Locale,
  LOCALE_COOKIE_NAME,
  LOCALES,
} from '@/utils/constants'
import { cookies, headers } from 'next/headers'

function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale)
}

function getBrowserLocale(acceptLanguage: string | null): Locale | undefined {
  const languages = (acceptLanguage ?? '')
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(';')
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith('q='))

      return {
        language: tag.split('-')[0].toLowerCase(),
        quality: quality ? parseFloat(quality.slice(2)) : 1,
      }
    })
    .filter(({ quality }) => quality > 0)
    .sort((a, b) => b.quality - a.quality)

  return languages.map(({ language }) => language).find(isLocale)
}

export async function getUserLocale() {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value

  if (isLocale(cookieLocale)) {
    return cookieLocale
  }

  const headerStore = await headers()

  return getBrowserLocale(headerStore.get('accept-language')) ?? DEFAULT_LOCALE
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies()

  cookieStore.set(LOCALE_COOKIE_NAME, locale)
}
