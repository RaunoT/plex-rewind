import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <div className='my-auto text-center sm:text-left'>
      <div className='flex flex-col items-center gap-6 sm:flex-row'>
        <h1 className='border-b border-white/20 pb-6 text-6xl font-bold uppercase sm:border-r sm:border-b-0 sm:pr-6 sm:pb-0'>
          {t('title')}
        </h1>
        <div>
          <p>{t('description')}</p>
          <Link href='/' className='link'>
            {t('cta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
