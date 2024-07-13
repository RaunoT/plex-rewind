import 'next-auth'
import 'next-auth/jwt'

type UserId = string
type UserAdmin = boolean

declare module 'next-auth/jwt' {
  interface JWT {
    id: UserId
    isAdmin: UserAdmin
  }
}

declare module 'next-auth' {
  interface Session {
    user: User & {
      id: UserId
      isAdmin: UserAdmin
    } & NextAuthUser
  }

  interface User {
    id: UserId
    isAdmin: UserAdmin
  }
}
