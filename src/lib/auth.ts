import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { isDemoEmail } from "@/lib/accounts"
import { resetDemoData } from "@/lib/demo-data"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.trim().toLowerCase()
        const user = await db.user.findUnique({ where: { email } })
        if (!user) return null
        const valid = verifyPassword(credentials.password, user.password)
        if (!valid) return null
        // Cuentas desactivadas por el admin no pueden entrar
        if (user.disabled) return null
        // El usuario demo se reinicia en cada login para una experiencia consistente
        if (isDemoEmail(email)) {
          try {
            await resetDemoData(user.id)
          } catch (e) {
            console.error("Error reiniciando datos demo:", e)
          }
        }
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const id = (user as { id: string }).id
        token.id = id
        // NextAuth v4 no transporta campos extra del objeto devuelto por
        // authorize; recuperamos el rol desde la BD en el momento del login.
        const dbUser = await db.user.findUnique({
          where: { id },
          select: { role: true, disabled: true },
        })
        token.role = dbUser?.role ?? "user"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const u = session.user as { id?: string; role?: string }
        u.id = token.id as string
        u.role = (token.role as string) ?? "user"
      }
      return session
    },
  },
}
