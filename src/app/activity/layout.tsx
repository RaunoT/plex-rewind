import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import CardWrapper from '../_components/CardWrapper'
import PageTitle from '../_components/PageTitle'

type Props = {
  children: ReactNode
}

export default async function ActivityLayout({ children }: Props) {
  const t = await getTranslations('Activity')
  const settings = getSettings()
  const session = await getServerSession(authOptions)

  if (
    !settings.activity.isActive ||
    (!session && !settings.general.isOutsideAccess)
  ) {
    return notFound()
  }

  return (
    <div className='mb-auto w-full max-w-(--breakpoint-sm)'>
      <PageTitle title={t('title')} />
      <CardWrapper className='min-h-[288px] sm:min-h-[292px]'>
        {children}
      </CardWrapper>
    </div>
  )
}
