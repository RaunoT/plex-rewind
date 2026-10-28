'use client'

import plexSvg from '@/assets/plex.svg'
import { MediaIcon } from '@/components/icons'
import SkeletonLine from '@/components/SkeletonLine'
import { PublicSettings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { SETTINGS_HREF, STATS_SOURCE_NAMES } from '@/utils/constants'
import { canViewFeature, Viewer } from '@/utils/helpers'
import {
  ArrowPathIcon,
  BackwardIcon,
  Cog6ToothIcon,
  HomeIcon,
  SignalIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { kebabCase } from 'lodash'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, Suspense, use, useContext } from 'react'
import AccountMenu from './AccountMenu'
import { GlobalContext } from './GlobalContextProvider'
import { AppInfoContext } from './HeaderControls'

type Props = {
  libraries: Promise<TautulliLibrary[] | null>
  settings: PublicSettings
}

export default function Sidebar({ libraries, settings }: Props) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { version } = useContext(AppInfoContext)
  const {
    dashboard: { isPersonal, period, sortBy },
  } = useContext(GlobalContext)
  const t = useTranslations()
  const isLoggedIn = status === 'authenticated'
  const isAdmin = isLoggedIn && !!session?.user.isAdmin
  const viewer: Viewer = { isLoggedIn, isAdmin }
  const isSettings = pathname.startsWith('/settings')
  const dashboardParams = new URLSearchParams({
    ...(isPersonal && { personal: 'true' }),
    ...(period && { period }),
    ...(sortBy && { sortBy }),
  })
  const dashboardQuery = dashboardParams.size
    ? `?${dashboardParams.toString()}`
    : ''

  return (
    <aside
      data-sidebar
      className='glass-sheet fixed inset-y-4 left-4 z-30 hidden w-60 flex-col overflow-y-auto rounded-[calc(var(--radius-xl)+--spacing(2))] p-2 lg:flex'
    >
      <Link
        href='/'
        className='focus-visible:focus-ring mb-2 flex h-10 shrink-0 items-center rounded-xl px-3 text-xl leading-none font-bold tracking-tight'
      >
        {settings.general.serverName ? (
          <span className='truncate'>{settings.general.serverName}</span>
        ) : (
          <span className='whitespace-nowrap'>
            <Image src={plexSvg} className='plex-logo' alt='Plex' priority />
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span>rewind</span>
          </span>
        )}
      </Link>

      <nav aria-label={t('Sidebar.label')}>
        <ul className='flex flex-col gap-0.5'>
          <SidebarLink href='/' icon={<HomeIcon />} isActive={pathname === '/'}>
            {t('Home.title')}
          </SidebarLink>
          {canViewFeature(settings, 'rewind', viewer) && (
            <SidebarLink
              href='/rewind'
              icon={<BackwardIcon />}
              isActive={pathname.startsWith('/rewind')}
            >
              {t('Rewind.title')}
            </SidebarLink>
          )}
          {canViewFeature(settings, 'activity', viewer) && (
            <SidebarLink
              href='/activity'
              icon={<SignalIcon />}
              isActive={pathname.startsWith('/activity')}
            >
              {t('Activity.title')}
            </SidebarLink>
          )}
          {canViewFeature(settings, 'dashboard', viewer) && (
            <Suspense
              fallback={
                <DashboardLinksSkeleton
                  count={settings.general.activeLibraries.length}
                />
              }
            >
              <DashboardLinks
                libraries={libraries}
                settings={settings}
                pathname={pathname}
                query={dashboardQuery}
              />
            </Suspense>
          )}
        </ul>
      </nav>

      <div className='mt-auto flex flex-col gap-0.5 pt-6'>
        {isAdmin && (
          <ul className='flex flex-col gap-0.5'>
            <SidebarLink
              href={isSettings ? pathname : SETTINGS_HREF}
              icon={<Cog6ToothIcon />}
              isActive={isSettings}
            >
              {t('Settings.title')}
            </SidebarLink>
            {version.hasUpdate && (
              <li>
                <a
                  href='https://github.com/RaunoT/plex-rewind/releases'
                  target='_blank'
                  className='sidebar-link'
                >
                  <ArrowPathIcon />
                  <span className='truncate'>
                    {t('AppProvider.updateAvailable')}
                  </span>
                </a>
              </li>
            )}
          </ul>
        )}

        <div className='mt-2 border-t border-white/10 pt-2'>
          <AccountMenu />
        </div>
      </div>
    </aside>
  )
}

type DashboardLinksProps = {
  libraries: Promise<TautulliLibrary[] | null>
  settings: PublicSettings
  pathname: string
  query: string
}

function DashboardLinks({
  libraries: librariesPromise,
  settings,
  pathname,
  query,
}: DashboardLinksProps) {
  const libraries = use(librariesPromise)
  const t = useTranslations()

  if (libraries?.length === 0 && !settings.dashboard.isUsersPageActive) {
    return null
  }

  return (
    <>
      <DashboardHeading />
      {libraries === null ? (
        <li className='px-3 py-2 text-sm text-neutral-400'>
          {t('Error.sourceUnreachable', {
            source: STATS_SOURCE_NAMES[settings.connection.statisticsSource],
          })}
        </li>
      ) : (
        <>
          {libraries.map((library) => {
            const href = `/dashboard/${kebabCase(library.section_name)}`

            return (
              <SidebarLink
                key={library.section_id}
                href={`${href}${query}`}
                icon={<MediaIcon type={library.section_type} />}
                isActive={pathname === href}
              >
                {library.section_name}
              </SidebarLink>
            )
          })}
          {settings.dashboard.isUsersPageActive && (
            <SidebarLink
              href={`/dashboard/users${query}`}
              icon={<UsersIcon />}
              isActive={pathname === '/dashboard/users'}
            >
              {t('DashboardNavContent.users')}
            </SidebarLink>
          )}
        </>
      )}
    </>
  )
}

// One row for each library the settings list, so the links don't shift much
// once they load
function DashboardLinksSkeleton({ count }: { count: number }) {
  return (
    <>
      <DashboardHeading />
      {[...Array(Math.max(count, 1))].map((_, i) => (
        <li
          key={i}
          className='flex items-center gap-3 px-3 py-2 text-sm'
          aria-hidden='true'
        >
          <div className='skeleton size-5 shrink-0' />
          <SkeletonLine width='w-24' />
        </li>
      ))}
    </>
  )
}

function DashboardHeading() {
  const t = useTranslations('Dashboard')

  return (
    <li className='px-3 pt-5 pb-1.5 text-xs font-semibold text-neutral-400'>
      {t('title')}
    </li>
  )
}

type SidebarLinkProps = {
  href: string
  icon?: ReactNode
  isActive: boolean
  children: ReactNode
}

function SidebarLink({ href, icon, isActive, children }: SidebarLinkProps) {
  return (
    <li>
      <Link
        href={href}
        className='sidebar-link'
        aria-current={isActive ? 'page' : undefined}
      >
        {icon}
        <span className='truncate'>{children}</span>
      </Link>
    </li>
  )
}
