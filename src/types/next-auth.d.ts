import 'next-auth'
import 'next-auth/jwt'

type UserId = string
type UserAdmin = boolean

declare module 'next-auth/jwt' {
  interface JWT {
    id: UserId
    admin: UserAdmin
  }
}

declare module 'next-auth' {
  interface Session {
    user: User & {
      id: UserId
      admin: UserAdmin
    } & NextAuthUser
  }

  interface User {
    id: UserId
    admin: UserAdmin
  }
}
