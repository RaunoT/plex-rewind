import Link from 'next/link'

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="mb-5 text-4xl font-bold">Welcome!</h1>

      <Link href="/rewind/most-watched-tv" className="mx-auto button">
        Get started
      </Link>
    </div>
  )
}
