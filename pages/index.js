import Head from 'next/head'
import CardMostWatchedTv from '../components/CardMostWatchedTv/CardMostWatchedTv'

export default function Home() {
  return (
    <div className="bg-black min-h-screen text-white">
      <Head>
        <title>Plex Rewind</title>
        <meta name="description" content="Plex Rewind" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="container flex items-center justify-center min-h-screen">
          <CardMostWatchedTv />
        </div>
      </main>
    </div>
  )
}
