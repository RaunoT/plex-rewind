import Head from 'next/head'
import { useRouter } from 'next/router'
import Favicon from '../components/Favicon/Favicon'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const classNames =
    router.pathname === '/' ? 'min-h-screen' : 'sm:min-h-screen'

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900">
      <Head>
        <title>Plex Rewind</title>
        <meta
          name="description"
          content="Present user statistics and habits in a beautiful and organized manner"
        />
        <Favicon />
      </Head>

      <main
        className={`container flex flex-col items-center justify-center py-8 ${classNames}`}
      >
        <Component {...pageProps} />
      </main>
    </div>
  )
}

export default MyApp
