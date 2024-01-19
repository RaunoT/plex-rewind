import { settings } from '@/config/config'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export default async function ConnectionSettingsPage() {
  return <ConnectionSettingsForm settings={settings.connection} />
}
