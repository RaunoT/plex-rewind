'use client'

import { AppInfoContext } from '@/app/_components/HeaderControls'
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'

// Below everything else on the settings pages, linking to the release notes
export default function SettingsVersion() {
  const t = useTranslations('Settings')
  const { version } = useContext(AppInfoContext)

  return (
    <a
      href='https://github.com/RaunoT/plex-rewind/releases'
      target='_blank'
      className='glass-pill focus-visible:focus-ring mx-auto mt-4 flex w-fit items-center gap-1.5 px-3 py-1 font-mono text-xs text-neutral-300 transition-colors hover:text-white'
    >
      {version.hasUpdate ? (
        <>
          <ArrowUpCircleIcon className='text-success size-4 shrink-0' />
          {`${t('updateAvailable')}: ${version.currentVersion} → ${version.latestVersion}`}
        </>
      ) : (
        version.currentVersion
      )}
    </a>
  )
}
