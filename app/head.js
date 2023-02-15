export default function Head() {
  return (
    <>
      <meta charSet='UTF-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      <title>Plex Rewind</title>
      <meta
        name='description'
        content='Present user statistics and habits in a beautiful and organized manner'
      />
      {/* Favicon */}
      <link
        rel='apple-touch-icon'
        sizes='180x180'
        href='/apple-touch-icon.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='32x32'
        href='/favicon-32x32.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='16x16'
        href='/favicon-16x16.png'
      />
      <link rel='manifest' href='/site.webmanifest' />
      <link rel='mask-icon' href='/safari-pinned-tab.svg' color='#312e81' />
      <meta name='msapplication-TileColor' content='#312e81' />
      <meta name='theme-color' content='#312e81' />
    </>
  )
}
