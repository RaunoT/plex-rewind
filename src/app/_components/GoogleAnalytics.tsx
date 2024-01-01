import Script from 'next/script'

export default function GoogleAnalytics({ id }: { id: string }) {
  return (
    <>
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <Script
        id='google-analytics'
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${id}');
          `,
        }}
      />
    </>
  )
}
