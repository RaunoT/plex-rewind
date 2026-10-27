import { MediaIcon } from '@/components/icons'
import SkeletonLine from '@/components/SkeletonLine'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { DASHBOARD_PERIOD_COOKIE_NAME, getSiteUrl } from '@/utils/constants'
import { getItems } from '@/utils/getDashboard'
import getPeriod, { parseCustomPeriod } from '@/utils/getPeriod'
import { getImageProxyUrl } from '@/utils/imageProxy'
import { toPublicSettings } from '@/utils/publicSettings'
import { BackwardIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { kebabCase } from 'lodash'
import { Session } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Suspense } from 'react'
import ActivityTile from './ActivityTile'
import HeaderControls from './HeaderControls'
import LoginButton from './LoginButton'
import TilePoster from './TilePoster'

type Props = {
  settings: Settings
  session: Session | null
  libraries: TautulliLibrary[]
}

export default async function Overview({
  settings,
  session,
  libraries,
}: Props) {
  const t = await getTranslations()
  const firstName = session?.user.name?.split(' ')[0]
  const period = getDashboardPeriod(
    (await cookies()).get(DASHBOARD_PERIOD_COOKIE_NAME)?.value,
  )
  const customPeriod = parseCustomPeriod(settings.dashboard.customPeriod)
  const periodLabel =
    period === '7days'
      ? t('PeriodSelectContent.7days')
      : period === 'pastYear'
        ? t('PeriodSelectContent.pastYear')
        : period === 'allTime'
          ? t('PeriodSelectContent.allTime')
          : customPeriod > 1
            ? t('PeriodSelectContent.days', { count: customPeriod })
            : t('PeriodSelectContent.today')

  return (
    <div className='page-width'>
      <header
        data-page-header
        className='mb-6 flex min-h-10 items-center justify-between gap-3'
      >
        <h1 className='truncate text-2xl font-bold tracking-tight sm:text-3xl'>
          {firstName
            ? t('Home.greeting', { name: firstName })
            : settings.general.serverName || t('Home.title')}
        </h1>
        <div className='flex items-center gap-3'>
          {!session && (
            <Suspense>
              <LoginButton siteUrl={getSiteUrl()} />
            </Suspense>
          )}
          <HeaderControls className='lg:group-data-[sidebar]/app:hidden' />
        </div>
      </header>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {settings.rewind.isActive && session && (
          <div className='glass-sheet flex flex-col justify-between gap-6 sm:col-span-2'>
            <div>
              <h2 className='flex items-center gap-2 font-semibold'>
                <BackwardIcon className='size-5 text-neutral-400' />
                {t('Rewind.title')}
              </h2>
              <p className='mt-3 max-w-md text-xl font-semibold tracking-tight sm:text-2xl'>
                {t('Home.rewindDescription')}
              </p>
            </div>
            <Link href='/rewind' className='button'>
              {t('Home.rewind')}
            </Link>
          </div>
        )}
        {settings.activity.isActive && (
          <ActivityTile settings={toPublicSettings(settings)} />
        )}
        {settings.dashboard.isActive &&
          libraries.map((library) => (
            <Suspense
              key={library.section_id}
              fallback={<LibraryTileSkeleton library={library} />}
            >
              <LibraryTile
                library={library}
                settings={settings}
                period={period}
                periodLabel={periodLabel}
              />
            </Suspense>
          ))}
      </div>
    </div>
  )
}

type LibraryTileProps = {
  library: TautulliLibrary
  settings: Settings
  period: DashboardSearchParams['period']
  periodLabel: string
}

function getDashboardPeriod(value?: string): DashboardSearchParams['period'] {
  return value === '7days' || value === 'pastYear' || value === 'allTime'
    ? value
    : undefined
}

// The library's most watched title over the period chosen on the dashboard
async function LibraryTile({
  library,
  settings,
  period,
  periodLabel,
}: LibraryTileProps) {
  const t = await getTranslations()
  const { daysAgo } = getPeriod(period, settings)
  const [top] = await getItems(library, daysAgo, undefined, true)
  const topLabel =
    library.section_type === 'artist'
      ? t('Home.mostListened')
      : t('Home.mostWatched')
  const poster = !top?.thumb
    ? undefined
    : top.thumb.startsWith('https://image.tmdb.org')
      ? top.thumb
      : getImageProxyUrl(top.thumb)

  return (
    <Link
      href={`/dashboard/${kebabCase(library.section_name)}${period ? `?period=${period}` : ''}`}
      className='glass-sheet group focus-visible:focus-ring flex flex-col gap-4 transition-colors hover:bg-white/5'
    >
      <TileHeading name={library.section_name} type={library.section_type} />
      {top ? (
        <div className='flex items-center gap-3'>
          <div className='poster w-12'>
            <TilePoster key={poster} src={poster} />
          </div>
          <div className='min-w-0'>
            <p className='text-xs text-neutral-400'>
              {`${topLabel} · ${periodLabel}`}
            </p>
            <p className='truncate font-medium'>{top.title}</p>
            <ul className='icon-stats-container mt-1.5'>
              <li className='icon-stat-wrapper'>
                <MediaIcon type={library.section_type} />
                {t('MediaItem.statPlays', { count: top.total_plays })}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <p className='text-sm text-neutral-400'>{t('Dashboard.noActivity')}</p>
      )}
    </Link>
  )
}

// Built like a loaded tile, so nothing moves once the data arrives
function LibraryTileSkeleton({ library }: { library: TautulliLibrary }) {
  return (
    <div className='glass-sheet flex flex-col gap-4'>
      <TileHeading name={library.section_name} type={library.section_type} />
      <div className='flex items-center gap-3'>
        <div className='skeleton poster w-12' />
        <div className='min-w-0 flex-1'>
          <SkeletonLine className='text-xs' width='w-28' />
          <SkeletonLine width='w-2/3' />
          <div className='skeleton mt-1.5 h-5 w-20 sm:h-6' />
        </div>
      </div>
    </div>
  )
}

function TileHeading({ name, type }: { name: string; type?: string }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <h2 className='flex min-w-0 items-center gap-2 font-semibold'>
        {type && (
          <MediaIcon type={type} className='size-5 shrink-0 text-neutral-400' />
        )}
        <span className='truncate'>{name}</span>
      </h2>
      <ChevronRightIcon className='size-4 shrink-0 text-neutral-500 transition-transform group-hover:translate-x-0.5' />
    </div>
  )
}
