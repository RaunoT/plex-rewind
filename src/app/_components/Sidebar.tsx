'use client'

import plexSvg from '@/assets/plex.svg'
import { MediaIcon } from '@/components/icons'
import { PublicSettings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
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
import { ReactNode, useContext } from 'react'
import AccountMenu from './AccountMenu'
import { GlobalContext } from './GlobalContextProvider'
import { AppInfoContext, getSettingsLink } from './HeaderControls'

type Props = {
  libraries: TautulliLibrary[]
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
  const isAdmin = isLoggedIn && session?.user.isAdmin
  const canViewStats = isLoggedIn || settings.general.isOutsideAccess
  const isSettings = pathname.startsWith('/settings')
  const dashboardParams = new URLSearchParams({
    ...(isPersonal && { personal: 'true' }),
    ...(period && { period }),
    ...(sortBy && settings.dashboard.isSortByPlaysActive && { sortBy }),
  })
  const dashboardQuery = dashboardParams.size
    ? `?${dashboardParams.toString()}`
    : ''
  const showDashboard =
    settings.dashboard.isActive &&
    canViewStats &&
    (libraries.length > 0 || settings.dashboard.isUsersPageActive)

  return (
    <aside
      data-sidebar
      className='glass-sheet fixed inset-y-4 left-4 z-30 hidden w-60 flex-col overflow-y-auto rounded-[20px] p-2 lg:flex'
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
          {settings.rewind.isActive && isLoggedIn && (
            <SidebarLink
              href='/rewind'
              icon={<BackwardIcon />}
              isActive={pathname.startsWith('/rewind')}
            >
              {t('Rewind.title')}
            </SidebarLink>
          )}
          {settings.activity.isActive && canViewStats && (
            <SidebarLink
              href='/activity'
              icon={<SignalIcon />}
              isActive={pathname.startsWith('/activity')}
            >
              {t('Activity.title')}
            </SidebarLink>
          )}
          {showDashboard && (
            <>
              <li className='px-3 pt-5 pb-1.5 text-xs font-semibold text-neutral-400'>
                {t('Dashboard.title')}
              </li>
              {libraries.map((library) => {
                const href = `/dashboard/${kebabCase(library.section_name)}`

                return (
                  <SidebarLink
                    key={library.section_id}
                    href={`${href}${dashboardQuery}`}
                    icon={<MediaIcon type={library.section_type} />}
                    isActive={pathname === href}
                  >
                    {library.section_name}
                  </SidebarLink>
                )
              })}
              {settings.dashboard.isUsersPageActive && (
                <SidebarLink
                  href={`/dashboard/users${dashboardQuery}`}
                  icon={<UsersIcon />}
                  isActive={pathname === '/dashboard/users'}
                >
                  {t('DashboardNavContent.users')}
                </SidebarLink>
              )}
            </>
          )}
        </ul>
      </nav>

      <div className='mt-auto flex flex-col gap-0.5 pt-6'>
        {isAdmin && (
          <ul className='flex flex-col gap-0.5'>
            <SidebarLink
              href={isSettings ? pathname : getSettingsLink(pathname)}
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
