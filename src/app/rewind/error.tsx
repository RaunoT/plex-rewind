'use client'

import RouteError, { RouteErrorProps } from '@/components/RouteError'

export default function Error(props: RouteErrorProps) {
  return <RouteError {...props} logPrefix='REWIND' isInCard />
}
