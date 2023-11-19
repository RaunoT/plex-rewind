export { default } from 'next-auth/middleware'

// TODO: Also disallow based on .env variables
export const config = { matcher: ['/dashboard/:path*', '/rewind/:path*'] }
