import MediaItems from '@/components/MediaItem/MediaItems';
import { UserRewind } from '@/utils/types';
import { FilmIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import RewindStat from '../RewindStat';
import StoryWrapper from '../StoryWrapper';

export default function StoryMovies({
	userRewind,
	isPaused,
	pause,
	resume,
}: UserRewind) {
	return (
		<StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
			{userRewind.movies_total_duration ? (
				<>
					<RewindStat isPaused={isPaused} scaleDelay={3}>
						<p>
							<span className='rewind-stat'>
								{userRewind.movies_total_duration}
							</span>{' '}
							of your time was spent watching{' '}
							<span className='rewind-cat'>
								Movies
								<FilmIcon />
							</span>{' '}
							on <span className='text-yellow-500'>Plex</span>.
						</p>
					</RewindStat>

					<RewindStat isPaused={isPaused} renderDelay={3} noScale>
						<p className='mb-2'>
							Your favorite was{' '}
							<span className='rewind-cat'>
								{userRewind.movies_top[0].title}
							</span>
							!
						</p>

						<div className='text-base not-italic'>
							<MediaItems
								type='movie'
								items={Array(userRewind.movies_top[0])}
								serverId={userRewind.server_id}
								rows
							/>
						</div>
					</RewindStat>
				</>
			) : (
				<RewindStat noScale>
					<p>
						You haven&apos;t watched any{' '}
						<span className='rewind-cat'>
							Movies
							<PlayCircleIcon />
						</span>{' '}
						on <span className='text-yellow-500'>Plex</span> this year{' '}
						<span className='not-italic'>😵‍💫</span>
					</p>
				</RewindStat>
			)}
		</StoryWrapper>
	);
}
