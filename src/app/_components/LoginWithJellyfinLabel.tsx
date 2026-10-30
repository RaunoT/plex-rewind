import jellyfinSvg from '@/assets/jellyfin.svg'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

// Jellyfin's logo in white, on the button's gradient like the text. Its icon
// stands taller than the letters, so it's sized to line up with the text.
export default function LoginWithJellyfinLabel() {
  const t = useTranslations('Home')

  return (
    <span className='font-bold'>
      {t.rich('loginWithJellyfin', {
        jellyfin: () => (
          <Image
            src={jellyfinSvg}
            alt='Jellyfin'
            className='ml-[0.15em] inline h-[1.5em] w-auto align-[-0.42em]'
          />
        ),
      })}
    </span>
  )
}
