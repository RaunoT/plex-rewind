import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import DashboardSettingsForm from './_components/DashboardSettingsForm'

export const metadata: Metadata = {
  title: 'Dashboard settings',
}

export default async function DashboardSettingsPage() {
  const settings = getSettings()

  return <DashboardSettingsForm settings={settings} />
}
