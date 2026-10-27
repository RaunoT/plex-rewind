'use client'

import { Version } from '@/types'
import { PublicSettings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import clsx from 'clsx'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import stars from '../_assets/stars.png'
import GlobalContextProvider from './GlobalContextProvider'
import HeaderControls, { AppInfoContext } from './HeaderControls'
import Sidebar from './Sidebar'

type Props = {
  children: ReactNode
  missingSetting: string | null
  version: Version
  // Streamed in, and null when the source can't be reached
  libraries: Promise<TautulliLibrary[] | null>
  settings: PublicSettings
  canBrowse: boolean
}

const SIDEBAR_ROUTES = ['/dashboard', '/rewind', '/activity', '/settings']
const queryClient = new QueryClient()

export default function AppProvider({
  children,
  missingSetting,
  version,
  libraries,
  settings,
  canBrowse,
}: Props) {
  const pathname = usePathname()
  // Not during setup or before logging in, when there's nothing to browse yet
  const hasSidebar =
    !missingSetting &&
    canBrowse &&
    (pathname === '/' ||
      SIDEBAR_ROUTES.some((route) => pathname.startsWith(route)))

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalContextProvider>
        <AppInfoContext value={{ missingSetting, version }}>
          <div className='group/app' data-sidebar={hasSidebar || undefined}>
            {hasSidebar && (
              <Sidebar libraries={libraries} settings={settings} />
            )}
            <main
              className={clsx(
                'group/main flex h-full min-h-dvh flex-col items-center overflow-x-hidden px-4 pt-3 pb-6 sm:pt-4',
                {
                  'justify-center':
                    (pathname === '/' && !hasSidebar) ||
                    pathname === '/~offline',
                  'lg:pr-6 lg:pl-70': hasSidebar,
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

              {/* Pages with a header, or the sidebar, show these controls instead */}
              <HeaderControls className='absolute top-3 right-4 z-10 group-has-[[data-page-header]]/main:hidden sm:top-4 lg:group-data-[sidebar]/app:hidden' />

              {children}
            </main>
          </div>
        </AppInfoContext>
      </GlobalContextProvider>
    </QueryClientProvider>
  )
}
