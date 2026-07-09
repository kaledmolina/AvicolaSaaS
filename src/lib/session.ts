import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
}

// Devuelve el usuario autenticado en el servidor, o null.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const id = (session.user as { id?: string }).id
  if (!id) return null
  return { id, name: session.user.name, email: session.user.email }
}
