import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import clsx from 'clsx'
import MediaItem from './MediaItem'

type Props = {
  items: TautulliItemRow[]
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId: string
  rows?: boolean
  settings: Settings
  loggedInUserId?: string
}

export default function MediaItems({
  items,
  type,
  serverId,
  rows,
  settings,
  loggedInUserId,
}: Props) {
  return (
    <ul
      className={clsx(
        'mt-4 flex flex-col gap-y-3 overflow-hidden sm:mt-6 sm:gap-y-5',
        {
          'lg:grid lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-8':
            !rows,
        },
      )}
    >
      {items.map((itemData, i) => (
        <MediaItem
          data={itemData}
          i={i}
          key={i}
          type={type}
          serverId={serverId}
          activeStats={settings.dashboard.activeItemStatistics}
          settings={settings}
          loggedInUserId={loggedInUserId}
          items={items}
        />
      ))}
    </ul>
  )
}
