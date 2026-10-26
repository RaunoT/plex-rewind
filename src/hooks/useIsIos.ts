import { isIosDevice } from '@/utils/deeplink'
import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

export default function useIsIos() {
  return useSyncExternalStore(subscribe, isIosDevice, () => false)
}
