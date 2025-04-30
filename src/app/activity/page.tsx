import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import ActivityContent from './_components/ActivityContent'

export const metadata: Metadata = {
  title: 'Activity',
}

export default function ActivityPage() {
  const settings = getSettings()

  return <ActivityContent settings={settings} />
}
