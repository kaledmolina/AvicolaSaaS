import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100),
})

export async function POST(req: Request) {
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
