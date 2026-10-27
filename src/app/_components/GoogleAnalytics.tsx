import { GOOGLE_ANALYTICS_ID_PATTERN } from '@/utils/constants'
import Script from 'next/script'

type Props = {
  id: string
  nonce?: string
}

export default function GoogleAnalytics({ id, nonce }: Props) {
  // The ID ends up inside an inline script, so anything that isn't a plain
  // Google tag ID is never rendered.
  if (!GOOGLE_ANALYTICS_ID_PATTERN.test(id)) {
    return null
  }

  return (
    <>
      <Script
        async
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
      <Script
        id='google-analytics'
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', ${JSON.stringify(id)});
          `,
        }}
      />
    </>
  )
}
