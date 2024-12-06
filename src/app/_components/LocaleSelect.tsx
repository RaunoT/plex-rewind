import { setUserLocale } from '@/i18n/locale'
import { Locale, LOCALES } from '@/utils/constants'
import { useLocale, useTranslations } from 'next-intl'

export default function LocaleSelect() {
  const locale = useLocale()
  const t = useTranslations('LocaleSelect')

  return (
    <div className='input-wrapper'>
      <div className='select-wrapper select-wrapper--small'>
        <select
          className='input input--small'
          onChange={(e) => setUserLocale(e.target.value as Locale)}
          defaultValue={locale}
          aria-label={t('label')}
        >
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {locale}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
