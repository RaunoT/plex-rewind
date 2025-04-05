import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <div className='pt-32 text-center sm:pt-0 sm:text-left'>
      <div className='flex flex-col items-center gap-6 sm:flex-row'>
        <h1 className='border-b border-white pb-6 text-6xl font-bold uppercase sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6'>
          {t('title')}
        </h1>
        <div>
          <p className='italic'>{t('description')}</p>
          <Link href='/' className='link italic'>
            {t('cta')}
          </Link>
        </div>
      </div>
    </div>
  )
}
