import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'
import ActivitiesCard from './_components/ActivitiesCard'
import StreamDetailsSwitch from './_components/StreamDetailsSwitch'

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
    <div className='page-width mb-auto'>
      <PageTitle title={t('title')} />
      <div className='mb-4 flex justify-end'>
        <StreamDetailsSwitch />
      </div>
      <ActivitiesCard>{children}</ActivitiesCard>
    </div>
  )
}
