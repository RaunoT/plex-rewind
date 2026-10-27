import { PublicSettings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import clsx from 'clsx'
import MediaItem from './MediaItem'

type Props = {
  items: TautulliItemRow[]
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId: string
  rows?: boolean
  settings: PublicSettings
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
        'flex flex-col overflow-hidden text-white',
        rows && 'mt-4 sm:mt-5',
      )}
    >
      {items.map((itemData, i) => (
        <MediaItem
          data={itemData}
          i={i}
          key={i}
          type={type}
          serverId={serverId}
          activeStats={settings.general.activeItemStatistics}
          settings={settings}
          loggedInUserId={loggedInUserId}
        />
      ))}
    </ul>
  )
}
