import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'

type Props = {
  children: ReactNode
}

export default async function ActivityLayout({ children }: Props) {
  const t = await getTranslations('Activity')

  return (
    <div className='flex w-full max-w-2xl flex-1 flex-col sm:flex-none'>
      <PageTitle title={t('title')} />
      {children}
    </div>
  )
}
