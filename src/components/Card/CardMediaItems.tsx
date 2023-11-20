import { TautulliItem } from '@/utils/fetchTautulli'
import clsx from 'clsx'
import CardMediaItem from './CardMediaItem'

type Props = {
  items: TautulliItem[]
  type: string
  serverId: string
  personal?: boolean
}

export default function CardMediaItems({
  items,
  type,
  serverId,
  personal,
}: Props) {
  return (
    <ul
      className={clsx(
        'mt-4 flex flex-col gap-y-3 overflow-hidden sm:mt-6 sm:gap-y-5',
        {
          'lg:grid lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-8':
            !personal,
        },
      )}
    >
      {items.map((itemData, i) => (
        <CardMediaItem
          data={itemData}
          i={i}
          key={i}
          type={type}
          serverId={serverId}
          personal={personal}
        />
      ))}
    </ul>
  )
}
