import PageTitle from '@/app/_components/PageTitle'
import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import {
  canViewFeature,
  getViewer,
  sortByActiveLibraries,
} from '@/utils/helpers'
import { getLibraries } from '@/utils/statsSource'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import DashboardNav from './_components/DashboardNav'

type Props = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const settings = getSettings()
  const session = await getServerSession(authOptions)

  if (!canViewFeature(settings, 'dashboard', getViewer(session))) {
    return notFound()
  }

  const libraries = await getLibraries()
  const activeLibraries = sortByActiveLibraries(libraries, settings)
  const t = await getTranslations('Dashboard')

  return (
    <div className='page-width flex flex-1 flex-col lg:flex-none'>
      <PageTitle
        title={t('title')}
        isNavInSidebar
        titleMenu={
          <DashboardNav
            libraries={activeLibraries}
            isUsersPageActive={settings.dashboard.isUsersPageActive}
            isMenu
          />
        }
      >
        <DashboardNav
          libraries={activeLibraries}
          isUsersPageActive={settings.dashboard.isUsersPageActive}
        />
      </PageTitle>
      {children}
    </div>
  )
}
