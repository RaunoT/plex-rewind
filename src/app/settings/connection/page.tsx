import { settings } from '@/config/config'
import { Metadata } from 'next'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export const metadata: Metadata = {
  title: 'Connection Settings',
}

export default async function ConnectionSettingsPage() {
  return <ConnectionSettingsForm settings={settings.connection} />
}
