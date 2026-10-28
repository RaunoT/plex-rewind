import StatusMessage from '@/components/StatusMessage'
import { SignalSlashIcon } from '@heroicons/react/24/outline'
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
    <StatusMessage
      icon={SignalSlashIcon}
      title={t('title')}
      as='h1'
      action={<RetryButton />}
    />
  )
}
