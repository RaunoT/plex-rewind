'use client'

import { AppInfoContext } from '@/app/_components/HeaderControls'
import { useContext } from 'react'

// Below everything else on the settings pages, linking to the release notes
export default function SettingsVersion() {
  const { version } = useContext(AppInfoContext)

  return (
    <a
      href='https://github.com/RaunoT/rewindarr/releases'
      target='_blank'
      className='glass-pill focus-visible:focus-ring mx-auto mt-4 block w-fit px-3 py-1 font-mono text-xs text-neutral-300 transition-colors hover:text-white'
    >
      {version.currentVersion}
    </a>
  )
}
