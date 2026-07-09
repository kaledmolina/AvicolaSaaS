import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { UserRole } from "@/lib/types"

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  role: UserRole
}

// Devuelve el usuario autenticado en el servidor, o null.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const id = (session.user as { id?: string }).id
  if (!id) return null
  const role = ((session.user as { role?: string }).role ?? "user") as UserRole
  return { id, name: session.user.name, email: session.user.email, role }
}

// Requiere admin; devuelve el usuario admin o lanza una Response 403 lista para usar.
export async function requireAdmin(): Promise<{ user: SessionUser } | { response: Response }> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      response: new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    }
  }
  if (user.role !== "admin") {
    return {
      response: new Response(JSON.stringify({ error: "Acceso restringido a administradores" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    }
  }
  return { user }
}
