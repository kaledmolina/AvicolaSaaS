import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

// POST /api/batches — creación de lote
const batchInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar 120 caracteres"),
  initialCount: z.coerce
    .number()
    .int("La cantidad inicial debe ser un número entero")
    .min(1, "La cantidad inicial debe ser mayor o igual a 1"),
  startDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha de inicio inválida"),
  status: z.enum(["active", "closed"]).optional(),
  notes: z
    .string()
    .max(1000, "Las notas no pueden superar 1000 caracteres")
    .nullable()
    .optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const batches = await db.batch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(batches)
  } catch (err) {
    console.error("GET /api/batches", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = batchInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const { name, initialCount, startDate, status, notes } = parsed.data

  try {
    const batch = await db.batch.create({
      data: {
        userId: user.id,
        name,
        initialCount,
        startDate: new Date(startDate),
        status: status ?? "active",
        notes: notes?.trim() ? notes.trim() : null,
      },
    })
    return NextResponse.json(batch, { status: 201 })
  } catch (err) {
    console.error("POST /api/batches", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
