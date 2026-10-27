'use client'

import Avatar from '@/components/Avatar'
import { setUserLocale } from '@/i18n/locale'
import { Locale, LOCALES } from '@/utils/constants'
import {
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
  ChevronUpDownIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { signOut, useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { startTransition } from 'react'
import {
  Button,
  Header,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Popover,
  Separator,
} from 'react-aria-components'

type Props = {
  // An avatar-only button, for the header on small screens
  isCompact?: boolean
}

function getLocaleName(code: string) {
  const name = new Intl.DisplayNames(code, { type: 'language' }).of(code)

  return name ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code
}

// Who is signed in, with the language and sign out tucked behind it
export default function AccountMenu({ isCompact }: Props) {
  const { data: session, status } = useSession()
  const locale = useLocale()
  const t = useTranslations()
  const user = status === 'authenticated' ? session?.user : undefined

  function changeLocale(code: Locale) {
    startTransition(() => {
      setUserLocale(code)
    })
  }

  return (
    <MenuTrigger>
      <Button
        className={isCompact ? 'icon-button' : 'sidebar-link w-full'}
        aria-label={
          isCompact ? user?.name || t('LocaleSelect.label') : undefined
        }
      >
        {user ? (
          <span className='relative size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15'>
            <Avatar src={user.image} name={user.name ?? ''} sizes='4rem' />
          </span>
        ) : (
          <GlobeAltIcon />
        )}
        {!isCompact && (
          <>
            <span className='min-w-0 flex-1 truncate text-left'>
              {user ? user.name : getLocaleName(locale)}
            </span>
            <ChevronUpDownIcon className='size-4!' />
          </>
        )}
      </Button>
      <Popover
        placement={isCompact ? 'bottom end' : 'top start'}
        offset={8}
        className={clsx(
          'glass-sheet menu',
          isCompact ? 'w-56' : 'w-(--trigger-width)',
        )}
      >
        <Menu className='outline-none'>
          <MenuSection
            selectionMode='single'
            selectedKeys={[locale]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const [code] = [...keys]

              if (code) {
                changeLocale(code as Locale)
              }
            }}
          >
            <Header className='px-3 pt-1.5 pb-1 text-xs font-semibold text-neutral-400'>
              {t('LocaleSelect.label')}
            </Header>
            {LOCALES.map((code) => (
              <MenuItem
                key={code}
                id={code}
                textValue={getLocaleName(code)}
                className='menu-item'
              >
                {({ isSelected }) => (
                  <>
                    <span lang={code}>{getLocaleName(code)}</span>
                    {isSelected && <CheckIcon className='ml-auto size-4!' />}
                  </>
                )}
              </MenuItem>
            ))}
          </MenuSection>
          {user && (
            <>
              <Separator className='mx-2 my-1 h-px border-0 bg-white/10' />
              <MenuItem onAction={() => signOut()} className='menu-item'>
                <ArrowRightStartOnRectangleIcon />
                {t('Home.signOut')}
              </MenuItem>
            </>
          )}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}
