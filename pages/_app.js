import Head from 'next/head'
import { useRouter } from 'next/router'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const classNames =
    router.pathname === '/' ? 'min-h-screen' : 'pt-10 sm:pt-0 sm:min-h-screen'

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900">
      <Head>
        <title>Plex Rewind</title>
        <meta name="description" content="Plex Rewind" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        className={`container flex flex-col items-center justify-center ${classNames}`}
      >
        <Component {...pageProps} />
      </main>
    </div>
  )
}

export default MyApp
