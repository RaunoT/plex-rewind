import { getSettings } from '@/utils/settings'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export default async function ConnectionSettingsPage() {
  const settings = await getSettings()

  return <ConnectionSettingsForm settings={settings?.connection} />
}
