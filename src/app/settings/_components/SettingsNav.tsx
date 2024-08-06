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
            href='/settings/general'
            className='nav-link'
            aria-current={pathname === '/settings/general' && 'page'}
          >
            General
          </Link>
        </li>
        <li>
          <Link
            href='/settings/rewind'
            className='nav-link'
            aria-current={pathname === '/settings/rewind' && 'page'}
          >
            Rewind
          </Link>
        </li>
        <li>
          <Link
            href='/settings/dashboard'
            className='nav-link'
            aria-current={pathname === '/settings/dashboard' && 'page'}
          >
            Dashboard
          </Link>
        </li>
      </ul>
    </nav>
  )
}
