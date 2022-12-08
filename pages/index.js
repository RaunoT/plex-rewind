import Head from 'next/head'

export default function Home() {
  return (
    <div className="bg-black min-h-screen text-white">
      <Head>
        <title>Plex Rewind</title>
        <meta name="description" content="Plex Rewind" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="text-3xl font-bold">Hello world!</h1>
      </main>
    </div>
  )
}
