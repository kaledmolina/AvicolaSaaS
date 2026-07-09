import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Validación de contraseña robusta:
//  - mínimo 8 caracteres
//  - al menos una letra
//  - al menos un número
const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(100, "Contraseña demasiado larga")
  .refine((p) => /[a-zA-Z]/.test(p), "Debe incluir al menos una letra")
  .refine((p) => /\d/.test(p), "Debe incluir al menos un número")

const schema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(80, "El nombre es demasiado largo")
    .refine((n) => n.trim().length > 0, "El nombre es obligatorio"),
  email: z.string().email("Email inválido").max(200),
  password: passwordSchema,
})

// Rate limit de registro: 5 cuentas por IP cada hora (anti-abuso).
const REGISTER_MAX = 5
const REGISTER_WINDOW = 60 * 60 * 1000

export async function POST(req: Request) {
  // Rate limiting
  const ip = getClientIp(req)
  const rl = rateLimit(`register:${ip}`, REGISTER_MAX, REGISTER_WINDOW)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados registros. Intenta más tarde." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const { name, email, password } = parsed.data
  const emailNorm = email.trim().toLowerCase()

  const exists = await db.user.findUnique({ where: { email: emailNorm } })
  if (exists) {
    return NextResponse.json({ error: "Ya existe una cuenta con este email" }, { status: 409 })
  }

  const user = await db.user.create({
    data: { name: name.trim(), email: emailNorm, password: hashPassword(password) },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(user, { status: 201 })
}
