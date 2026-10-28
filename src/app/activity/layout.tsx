import CardWrapper from '@/app/_components/CardWrapper'
import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'

type Props = {
  children: ReactNode
}

export default async function ActivityLayout({ children }: Props) {
  const t = await getTranslations('Activity')
  const settings = getSettings()
  const session = await getServerSession(authOptions)

  if (!canViewFeature(settings, 'activity', getViewer(session))) {
    return notFound()
  }

  return (
    <div className='page-width-narrow mb-auto'>
      <PageTitle title={t('title')} />
      <CardWrapper>{children}</CardWrapper>
    </div>
  )
}
