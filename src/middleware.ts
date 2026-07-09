import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

// Protege todas las rutas /api/* (excepto auth y registro público).
// Para APIs respondemos 401 JSON (sin redirección), que es lo que espera
// el frontend (TanStack Query / fetch). La página "/" queda pública.

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) {
    // Respuesta JSON 401 para rutas de API.
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
