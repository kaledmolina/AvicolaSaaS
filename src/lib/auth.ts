import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { isDemoEmail } from "@/lib/accounts"
import { resetDemoData } from "@/lib/demo-data"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Máximos intentos de login por IP en la ventana.
const LOGIN_MAX = 10
const LOGIN_WINDOW = 15 * 60 * 1000 // 15 min

export const authOptions: NextAuthOptions = {
  // Secret explícito para garantizar que todos los handlers y el middleware
  // usen el mismo en entornos Turbopack donde process.env puede variar.
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // JWT de corta duración: 12h. El usuario debe reautenticarse tras expirar.
    maxAge: 12 * 60 * 60,
    // Renovación cada 1h (el token se refresca sin re-login si está activo).
    updateAge: 60 * 60,
  },
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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        // Rate limiting por IP para mitigar fuerza bruta.
        // NextAuth v4 pasa un objeto req propio con headers como Record.
        const headers =
          (req as unknown as { headers?: Record<string, string> })?.headers ?? {}
        const ip =
          headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          headers["x-real-ip"] ||
          headers["cf-connecting-ip"] ||
          "unknown"
        const rl = rateLimit(`login:${ip}`, LOGIN_MAX, LOGIN_WINDOW)
        if (!rl.allowed) {
          throw new Error(
            "Demasiados intentos. Intenta nuevamente en unos minutos."
          )
        }

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
        // authorize; recuperamos el rol y estado desde la BD en el login.
        const dbUser = await db.user.findUnique({
          where: { id },
          select: { role: true, disabled: true },
        })
        // Si la cuenta fue desactivada tras el login, invalidamos el token.
        if (dbUser?.disabled) {
          token.role = "user"
          token.disabled = true
        } else {
          token.role = dbUser?.role ?? "user"
          token.disabled = false
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const u = session.user as { id?: string; role?: string; disabled?: boolean }
        u.id = token.id as string
        u.role = (token.role as string) ?? "user"
        u.disabled = (token.disabled as boolean) ?? false
      }
      return session
    },
  },
}
