import { requireSettingsAccess } from '@/lib/access'
import getSettings from '@/utils/getSettings'
import { toPublicSettings } from '@/utils/publicSettings'
import {
  getLibraries,
  getUsers,
  isStatsSourceReachable,
} from '@/utils/statsSource'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import GeneralSettingsForm from './_components/GeneralSettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.General')

  return {
    title: t('title'),
  }
}

export default async function GeneralSettingsPage() {
  await requireSettingsAccess()

  const settings = getSettings()
  const [libraries, users, isSourceReachable] = await Promise.all([
    getLibraries(false),
    getUsers(),
    isStatsSourceReachable(settings),
  ])

  return (
    <GeneralSettingsForm
      // A retry can bring in the libraries, which the form only reads once
      key={libraries.map((library) => library.section_id).join()}
      settings={toPublicSettings(settings)}
      libraries={libraries}
      users={users}
      isSourceReachable={isSourceReachable}
    />
  )
}
