import plexSvg from '@/assets/plex.svg'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

// The Plex wordmark in black, to sit on the gold button like the text. Bold,
// so the text is closer to the wordmark's weight
export default function LoginWithPlexLabel() {
  const t = useTranslations('Home')

  return (
    <span className='font-bold'>
      {t.rich('loginWithPlex', {
        plex: () => (
          <Image
            src={plexSvg}
            alt='Plex'
            className='inline h-[0.88em] w-auto align-[-0.164em] brightness-0'
          />
        ),
      })}
    </span>
  )
}
