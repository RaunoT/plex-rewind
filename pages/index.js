import Link from 'next/link'

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="mb-6 text-4xl font-bold">Plex Rewind</h1>

      <Link href="/rewind/top-tv" className="mx-auto mb-6 button">
        Get started
      </Link>

      <Link
        href="/dashboard/top-tv"
        className="text-slate-300 hover:opacity-75"
      >
        Dashboard
      </Link>
    </div>
  )
}
