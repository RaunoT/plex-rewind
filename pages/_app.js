import Head from 'next/head'
import Favicon from '../components/Favicon/Favicon'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900">
      <Head>
        <title>Plex Rewind</title>
        <meta name="description" content="Plex Rewind" />
        <Favicon />
      </Head>

      <main className="container flex flex-col items-center justify-center min-h-screen py-8">
        <Component {...pageProps} />
      </main>
    </div>
  )
}

export default MyApp
