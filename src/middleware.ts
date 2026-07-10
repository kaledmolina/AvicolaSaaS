import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protege todas las rutas /api/* (excepto auth y registro público).
// Verificamos la presencia de la cookie de sesión de NextAuth. La validación
// criptográfica completa del JWT la realiza cada handler con
// getCurrentUser() / getServerSession(authOptions), que es la fuente de
// verdad. El middleware es una primera línea de defensa.

const SESSION_COOKIE = "next-auth.session-token"
const SECURE_SESSION_COOKIE = "__Secure-next-auth.session-token"

export function middleware(req: NextRequest) {
  const sessionCookie =
    req.cookies.get(SESSION_COOKIE)?.value ||
    req.cookies.get(SECURE_SESSION_COOKIE)?.value

  if (!sessionCookie) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/((?!auth|register).*)",
  ],
}
