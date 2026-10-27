'use client'

import TitleMenu from '@/components/TitleMenu'
import { kebabCase } from 'lodash'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { DashboardNavProps } from './DashboardNav'

export default function DashboardNavContent({
  libraries,
  isUsersPageActive,
  isMenu,
}: DashboardNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = searchParams.toString()
  const t = useTranslations('DashboardNavContent')

  if (isMenu) {
    return (
      <TitleMenu
        label={t('label')}
        items={[
          ...libraries.map((library) => ({
            href: `/dashboard/${kebabCase(library.section_name)}${params ? '?' + params : ''}`,
            label: library.section_name,
            isCurrent:
              pathname === `/dashboard/${kebabCase(library.section_name)}`,
          })),
          ...(isUsersPageActive
            ? [
                {
                  href: `/dashboard/users${params ? '?' + params : ''}`,
                  label: t('users'),
                  isCurrent: pathname === '/dashboard/users',
                },
              ]
            : []),
        ]}
      />
    )
  }

  return (
    <nav aria-label={t('label')}>
      <ul className='nav'>
        {libraries.map((library) => (
          <li key={library.section_id}>
            <Link
              href={`/dashboard/${kebabCase(library.section_name)}${params ? '?' + params : ''}`}
              className='nav-link'
              aria-current={
                pathname === `/dashboard/${kebabCase(library.section_name)}` &&
                'page'
              }
            >
              {library.section_name}
            </Link>
          </li>
        ))}
        {isUsersPageActive && (
          <li>
            <Link
              href={`/dashboard/users${params ? '?' + params : ''}`}
              className='nav-link'
              aria-current={pathname === '/dashboard/users' && 'page'}
            >
              {t('users')}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
