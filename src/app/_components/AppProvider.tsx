'use client'

import Toasts from '@/components/Toasts'
import { Version } from '@/types'
import { PublicSettings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import clsx from 'clsx'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import stars from '../_assets/stars.png'
import GlobalContextProvider from './GlobalContextProvider'
import HeaderControls, {
  AppInfoContext,
  SETTINGS_RETURN_KEY,
} from './HeaderControls'
import Sidebar from './Sidebar'
import SourceOutageNotice from './SourceOutageNotice'

type Props = {
  children: ReactNode
  missingSetting: string | null
  version: Version
  // Streamed in, and null when the source can't be reached
  libraries: Promise<TautulliLibrary[] | null>
  settings: PublicSettings
  canBrowse: boolean
  // From its cookie, missing until the choice was first saved there
  isActivityDetailsHidden?: boolean
}

const SIDEBAR_ROUTES = ['/dashboard', '/rewind', '/activity', '/settings']
// Their pages keep to a narrower column, which the notice lines up with
const NARROW_ROUTES = ['/rewind', '/activity', '/settings']
const queryClient = new QueryClient()

export default function AppProvider({
  children,
  missingSetting,
  version,
  libraries,
  settings,
  canBrowse,
  isActivityDetailsHidden,
}: Props) {
  const pathname = usePathname()
  // Not during setup or before logging in, when there's nothing to browse yet
  const hasSidebar =
    !missingSetting &&
    canBrowse &&
    (pathname === '/' ||
      SIDEBAR_ROUTES.some((route) => pathname.startsWith(route)))

  useEffect(() => {
    if (!pathname.startsWith('/settings')) {
      try {
        sessionStorage.setItem(
          SETTINGS_RETURN_KEY,
          pathname + window.location.search,
        )
      } catch {}
    }
  }, [pathname])

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalContextProvider isDetailsHidden={isActivityDetailsHidden}>
        <AppInfoContext value={{ missingSetting, version }}>
          <div className='group/app' data-sidebar={hasSidebar || undefined}>
            {hasSidebar && (
              <Sidebar libraries={libraries} settings={settings} />
            )}
            <main
              className={clsx(
                // The same 16px around the page, the sidebar and between blocks
                'group/main flex h-full min-h-dvh flex-col items-center overflow-x-hidden p-4',
                {
                  'justify-center':
                    (pathname === '/' && !hasSidebar) ||
                    pathname === '/~offline',
                  'lg:pl-68': hasSidebar,
                },
              )}
            >
              <div className='fixed inset-0 -z-10 overflow-hidden bg-black select-none after:absolute after:inset-0 after:bg-black/50 after:content-[""]'>
                <div className='relative h-screen w-screen'>
                  <Image
                    src={stars}
                    alt=''
                    className='object-cover'
                    fill
                    priority
                  />
                </div>
                <div className='bg-twinkling' />
                <div className='bg-clouds sm:opacity-50' />
              </div>

              {/* The sidebar, or a page's header on smaller screens, shows these controls instead */}
              <HeaderControls className='absolute top-4 right-4 z-10 max-lg:group-has-[[data-page-header]]/main:hidden lg:group-data-[sidebar]/app:hidden' />

              {hasSidebar && (
                <SourceOutageNotice
                  source={settings.connection.statisticsSource}
                  isNarrow={NARROW_ROUTES.some((route) =>
                    pathname.startsWith(route),
                  )}
                />
              )}
              {children}
            </main>
          </div>
          <Toasts />
        </AppInfoContext>
      </GlobalContextProvider>
    </QueryClientProvider>
  )
}
