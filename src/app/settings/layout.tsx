import githubSvg from '@/assets/github.svg'
import Image from 'next/image'
import packageJson from '../../../package.json'
import PageTitle from '../_components/PageTitle'
import SettingsNav from './_components/SettingsNav'

type Props = {
  children: React.ReactNode
}

export default function Page({ children }: Props) {
  return (
    <div className='mb-auto w-full max-w-screen-sm'>
      <PageTitle title='Settings' />
      <SettingsNav />
      {children}
      <div className='mt-8 flex flex-col gap-2 sm:items-center'>
        <a
          href='https://github.com/RaunoT/plex-rewind/issues'
          target='_blank'
          className='link inline-flex gap-2'
        >
          <Image src={githubSvg} alt='GitHub' className='size-6' />
          If you encounter any issues, please report them on GitHub.
        </a>

        <a
          className='ml-8 w-fit font-mono text-xs text-white/25 sm:ml-0'
          href='https://github.com/RaunoT/plex-rewind/releases'
          target='_blank'
        >
          v{packageJson.version}
        </a>
      </div>
    </div>
  )
}
