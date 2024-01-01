import { bytesToSize } from '@/utils/formatting';
import { UserRewind } from '@/utils/types';
import {
	FilmIcon,
	FolderIcon,
	MusicalNoteIcon,
	PlayCircleIcon,
} from '@heroicons/react/24/outline';
import RewindStat from '../RewindStat';
import StatListItem from '../StatListItem';
import StoryWrapper from '../StoryWrapper';

export default function StoryLibraries({
	userRewind,
	isPaused,
	pause,
	resume,
}: UserRewind) {
	return (
		<StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
			<RewindStat isPaused={isPaused} scaleDelay={3}>
				<p>
					But, did you know the{' '}
					<span className='rewind-cat'>
						Filesize
						<FolderIcon />
					</span>{' '}
					of all the available content on{' '}
					<span className='text-yellow-500'>Plex</span> is{' '}
					<span className='rewind-stat'>
						{bytesToSize(userRewind.libraries_total_size)}
					</span>
					!
				</p>
			</RewindStat>

			<RewindStat isPaused={isPaused} renderDelay={3} noScale>
				<p>The current library consists of:</p>
				<ul className='list mt-2'>
					{userRewind.libraries.map((library) => {
						const libMap = {
							movie: {
								library: library.section_name,
								name: 'Movies',
								icon: <FilmIcon />,
								count: parseInt(library.count),
							},
							show: {
								library: library.section_name,
								name: 'Episodes',
								icon: <PlayCircleIcon />,
								count: parseInt(library.child_count),
							},
							artist: {
								library: library.section_name,
								name: 'Tracks',
								icon: <MusicalNoteIcon />,
								count: parseInt(library.child_count),
							},
						};
						const libType = library.section_type;

						return (
							<StatListItem key={library.section_id} {...libMap[libType]} />
						);
					})}
				</ul>
			</RewindStat>
		</StoryWrapper>
	);
}
