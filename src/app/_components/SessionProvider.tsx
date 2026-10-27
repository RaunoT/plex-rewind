'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  // From the server, so the first render already knows who is signed in
  session: Session | null
}

export default function SessionProviderWrapper({ children, session }: Props) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
