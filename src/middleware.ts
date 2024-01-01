export { default } from "next-auth/middleware"

// Disallow access to dashboard and rewind when not signed in
export const config = { matcher: ["/dashboard/:path*", "/rewind"] }
