'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className='mb-3'>
      <h2 className='sr-only'>Settings navigation</h2>
      <ul className='nav'>
        <li>
          <Link
            href='/settings/connection'
            className='nav-link'
            aria-current={pathname === '/settings/connection' && 'page'}
          >
            Connection
          </Link>
        </li>
        <li>
          <Link
            href='/settings/features'
            className='nav-link'
            aria-current={pathname === '/settings/features' && 'page'}
          >
            Features
          </Link>
        </li>
      </ul>
    </nav>
  )
}
