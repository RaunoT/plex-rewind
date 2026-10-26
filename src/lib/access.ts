import { Settings, SettingsFormInitialState } from '@/types/settings'
import getSettings from '@/utils/getSettings'
import { isInitialSetup } from '@/utils/helpers'
import { getServerSession, Session } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { authOptions } from './auth'

// Layouts don't run for every request that renders a page or action, so pages
// and server actions check access themselves.
export function canViewStats(
  settings: Settings,
  session: Session | null,
): boolean {
  return !!session || settings.general.isOutsideAccess
}

// Settings are open to anyone only until the first setup has been completed.
export async function canManageSettings(
  settings: Settings = getSettings(),
): Promise<boolean> {
  if (isInitialSetup(settings)) {
    return true
  }

  const session = await getServerSession(authOptions)

  return !!session?.user?.isAdmin
}

export async function requireSettingsAccess(): Promise<void> {
  if (!(await canManageSettings())) {
    redirect('/')
  }
}

// Server actions can be called directly, so each settings action checks access
// before doing anything else.
export async function denySettingsAccess<T>(
  prevState: SettingsFormInitialState<T>,
): Promise<SettingsFormInitialState<T> | null> {
  if (await canManageSettings()) {
    return null
  }

  const t = await getTranslations('Settings')

  return {
    message: t('genericError'),
    status: 'error',
    fields: prevState?.fields,
  }
}
