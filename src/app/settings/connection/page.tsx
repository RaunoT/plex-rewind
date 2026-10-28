import { requireSettingsAccess } from '@/lib/access'
import { maskApiKeys } from '@/utils/connectionSecrets'
import { getTracearrPlexServers } from '@/utils/fetchTracearr'
import getSettings from '@/utils/getSettings'
import { isTracearrSource } from '@/utils/helpers'
import { getHistoryStatus } from '@/utils/statsSource'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.Connection')

  return {
    title: t('title'),
  }
}

export default async function ConnectionSettingsPage() {
  await requireSettingsAccess()

  const settings = getSettings()
  const isTracearr = isTracearrSource(settings)
  const [tracearrServers, historyStatus] = await Promise.all([
    isTracearr ? getTracearrPlexServers() : [],
    settings.connection.complete ? getHistoryStatus() : null,
  ])

  return (
    <ConnectionSettingsForm
      settings={{
        ...settings,
        connection: maskApiKeys(settings.connection),
      }}
      tracearrServers={tracearrServers}
      historyStatus={historyStatus}
    />
  )
}
