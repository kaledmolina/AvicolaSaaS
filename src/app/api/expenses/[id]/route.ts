import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

const expenseUpdateSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(200, "La descripción no puede superar 200 caracteres")
    .optional(),
  quantity: z.coerce
    .number()
    .positive("La cantidad debe ser mayor a 0")
    .optional(),
  unitPrice: z.coerce
    .number()
    .min(0, "El precio unitario debe ser mayor o igual a 0")
    .optional(),
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida")
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

  const parsed = expenseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const data = parsed.data

  try {
    const expense = await db.expense.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!expense || expense.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    const update: Record<string, unknown> = {}
    if (data.description !== undefined) update.description = data.description
    if (data.quantity !== undefined) update.quantity = data.quantity
    if (data.unitPrice !== undefined) update.unitPrice = data.unitPrice
    if (data.date !== undefined) update.date = new Date(data.date)

    const updated = await db.expense.update({ where: { id }, data: update })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PUT /api/expenses/[id]", err)
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
    const expense = await db.expense.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!expense || expense.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    await db.expense.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("DELETE /api/expenses/[id]", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
