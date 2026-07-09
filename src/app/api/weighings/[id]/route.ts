import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

const weighingUpdateSchema = z.object({
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida")
    .optional(),
  avgWeight: z.coerce
    .number()
    .positive("El peso promedio debe ser mayor a 0")
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

  const parsed = weighingUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const data = parsed.data

  try {
    const weighing = await db.weighing.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!weighing || weighing.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    const update: Record<string, unknown> = {}
    if (data.date !== undefined) update.date = new Date(data.date)
    if (data.avgWeight !== undefined) update.avgWeight = data.avgWeight

    const updated = await db.weighing.update({ where: { id }, data: update })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PUT /api/weighings/[id]", err)
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
    const weighing = await db.weighing.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!weighing || weighing.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    await db.weighing.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("DELETE /api/weighings/[id]", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
