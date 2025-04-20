import { DEFAULT_LOCALE } from '@/utils/constants'
import { getRequestConfig } from 'next-intl/server'
import { getUserLocale } from './locale'

export default getRequestConfig(async () => {
  const locale = (await getUserLocale()) || DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
