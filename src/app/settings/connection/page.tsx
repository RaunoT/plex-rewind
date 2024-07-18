import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export const metadata: Metadata = {
  title: 'Connection settings',
}

export default async function ConnectionSettingsPage() {
  const settings = await getSettings()

  return <ConnectionSettingsForm settings={settings} />
}
