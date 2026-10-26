import { setUserLocale } from '@/i18n/locale'
import { Locale, LOCALES } from '@/utils/constants'
import { useLocale, useTranslations } from 'next-intl'
import { ChangeEvent, startTransition } from 'react'

function getLocaleName(code: string) {
  const name = new Intl.DisplayNames(code, { type: 'language' }).of(code)

  return name ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code
}

export default function LocaleSelect() {
  const locale = useLocale()
  const t = useTranslations('LocaleSelect')

  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    startTransition(() => {
      setUserLocale(e.target.value as Locale)
    })
  }

  return (
    <div className='input-wrapper'>
      <div className='select-wrapper select-wrapper--small'>
        <select
          className='input input--small'
          onChange={onChange}
          defaultValue={locale}
          aria-label={t('label')}
        >
          {LOCALES.map((locale) => (
            <option key={locale} value={locale} lang={locale}>
              {getLocaleName(locale)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
