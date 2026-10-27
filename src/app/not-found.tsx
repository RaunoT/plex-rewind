import StatusMessage from '@/components/StatusMessage'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <StatusMessage
      title={t('title')}
      description={t('description')}
      as='h1'
      action={
        <Link href='/' className='button w-full'>
          {t('cta')}
        </Link>
      }
    />
  )
}
