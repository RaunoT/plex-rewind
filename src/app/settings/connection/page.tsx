import { requireSettingsAccess } from '@/lib/access'
import { maskApiKeys } from '@/utils/connectionSecrets'
import { getTracearrPlexServers } from '@/utils/fetchTracearr'
import getSettings from '@/utils/getSettings'
import { isTracearrSource } from '@/utils/helpers'
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
  const tracearrServers = isTracearrSource(settings)
    ? await getTracearrPlexServers()
    : []

  return (
    <ConnectionSettingsForm
      settings={{
        ...settings,
        connection: maskApiKeys(settings.connection),
      }}
      tracearrServers={tracearrServers}
    />
  )
}
