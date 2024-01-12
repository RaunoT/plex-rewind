import { getSettings } from '@/actions/get-settings'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export default async function ConnectionSettingsPage() {
  const formData = await getSettings()

  return <ConnectionSettingsForm formInitialState={formData} />
}
