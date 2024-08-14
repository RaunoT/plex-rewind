import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import RewindSettingsForm from './_components/RewindSettingsForm'

export const metadata: Metadata = {
  title: 'Rewind settings',
}

export default async function RewindSettingsPage() {
  const settings = getSettings()

  return <RewindSettingsForm settings={settings} />
}
