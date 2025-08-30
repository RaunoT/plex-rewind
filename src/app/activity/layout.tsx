import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'

type Props = {
  children: ReactNode
}

export default async function ActivityLayout({ children }: Props) {
  const t = await getTranslations('Activity')

  return (
    <div className='mb-auto w-full max-w-(--breakpoint-sm)'>
      <PageTitle title={t('title')} />
      {children}
    </div>
  )
}
