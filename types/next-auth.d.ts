// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      login: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    login: string
    hashedPassword?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    login: string
  }
}