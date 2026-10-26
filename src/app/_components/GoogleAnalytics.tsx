import { GOOGLE_ANALYTICS_ID_PATTERN } from '@/utils/constants'
import Script from 'next/script'

export default function GoogleAnalytics({ id }: { id: string }) {
  // The ID ends up inside an inline script, so anything that isn't a plain
  // Google tag ID is never rendered.
  if (!GOOGLE_ANALYTICS_ID_PATTERN.test(id)) {
    return null
  }

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
      <Script
        id='google-analytics'
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
