import CardText from '@/components/Card/CardText'
import StatListItem from '@/components/StatListItem'
import { bytesToSize } from '@/utils/formatting'
import {
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { UserRewind } from './RewindStories'

export default function StoryLibraries({ userRewind }: UserRewind) {
  return (
    <>
      <CardText scaleDelay={3}>
        <p>
          Did you know the{' '}
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
      </CardText>

      <CardText renderDelay={3} noScale>
        <p>The current library consist of:</p>
        <ul className='list'>
          {userRewind.libraries.map((library) => {
            switch (library.section_name) {
              case 'TV Shows':
                return (
                  <StatListItem
                    key={library.section_id}
                    count={parseInt(library.child_count)}
                    name='Episodes'
                    icon={<PlayCircleIcon />}
                  />
                )

              case 'Movies':
                return (
                  <StatListItem
                    key={library.section_id}
                    count={parseInt(library.count)}
                    name='Movies'
                    icon={<FilmIcon />}
                  />
                )

              case 'Music':
                return (
                  <StatListItem
                    key={library.section_id}
                    count={parseInt(library.child_count)}
                    name='Songs'
                    icon={<MusicalNoteIcon />}
                  />
                )
            }
          })}
        </ul>
      </CardText>
    </>
  )
}
