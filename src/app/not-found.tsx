import StatusMessage from '@/components/StatusMessage'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <StatusMessage
      icon={MagnifyingGlassIcon}
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
