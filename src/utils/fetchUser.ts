import { cookies } from 'next/headers'

export default async function fetchUser() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/me`, {
      headers: { Cookie: cookies().toString() },
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch user: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()

    return data
  } catch (error) {
    throw new Error(
      `Error fetching user: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}
