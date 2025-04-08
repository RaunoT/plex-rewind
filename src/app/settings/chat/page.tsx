import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import ChatSettingsForm from './_components/ChatSettingsForm'

export const metadata: Metadata = {
  title: 'Chat settings',
}

export default async function ChatSettingsPage() {
  const settings = getSettings()

  return <ChatSettingsForm settings={settings} />
}
