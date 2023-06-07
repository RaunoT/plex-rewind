import Head from 'next/head'

export default function Meta() {
  return (
    <Head>
      <title>Plex Rewind</title>
      <meta
        name='description'
        content='Present user statistics and habits in a beautiful and organized manner'
      />
      {/* TODO: Add og:image */}
      <meta property='og:image' content='/og-image.png' />
      {/* Favicon */}
      <link
        rel='apple-touch-icon'
        sizes='180x180'
        href='/favicon/apple-touch-icon.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='32x32'
        href='/favicon/favicon-32x32.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='16x16'
        href='/favicon/favicon-16x16.png'
      />
      <link rel='manifest' href='/favicon/site.webmanifest' />
      <link
        rel='mask-icon'
        href='/favicon/safari-pinned-tab.svg'
        color='#312e81'
      />
      <link rel='shortcut icon' href='/favicon.ico' />
      <meta name='msapplication-TileColor' content='#312e81' />
      <meta name='msapplication-config' content='/favicon/browserconfig.xml' />
      <meta name='theme-color' content='#312e81' />
    </Head>
  )
}
