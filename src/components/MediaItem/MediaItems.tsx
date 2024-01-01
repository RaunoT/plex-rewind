import { TautulliItemRow } from '@/utils/types';
import clsx from 'clsx';
import MediaItem from './MediaItem';

type Props = {
	items: TautulliItemRow[];
	type: string;
	serverId: string;
	rows?: boolean;
};

export default function MediaItems({ items, type, serverId, rows }: Props) {
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
				/>
			))}
		</ul>
	);
}
