import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Offline',
}

export default async function Page() {
  const t = await getTranslations('Offline')

  return <h1>{t('title')}</h1>
}
