import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

const mortalityUpdateSchema = z.object({
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida")
    .optional(),
  count: z.coerce
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad debe ser mayor o igual a 1")
    .optional(),
  cause: z
    .string()
    .max(200, "La causa no puede superar 200 caracteres")
    .nullable()
    .optional(),
})

type RouteCtx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: RouteCtx) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = mortalityUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const data = parsed.data

  try {
    const mortality = await db.mortality.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!mortality || mortality.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    const update: Record<string, unknown> = {}
    if (data.date !== undefined) update.date = new Date(data.date)
    if (data.count !== undefined) update.count = data.count
    if (data.cause !== undefined) {
      update.cause = data.cause?.trim() ? data.cause.trim() : null
    }

    const updated = await db.mortality.update({ where: { id }, data: update })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PUT /api/mortality/[id]", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, { params }: RouteCtx) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const { id } = await params

  try {
    const mortality = await db.mortality.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!mortality || mortality.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    await db.mortality.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("DELETE /api/mortality/[id]", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
