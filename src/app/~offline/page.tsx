import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import RetryButton from './_components/RetryButton'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Offline')

  return {
    title: t('title'),
  }
}

export default async function Page() {
  const t = await getTranslations('Offline')

  return (
    <div className='flex flex-col items-center gap-6 text-center'>
      <h1 className='text-3xl font-bold'>{t('title')}</h1>
      <RetryButton />
    </div>
  )
}
