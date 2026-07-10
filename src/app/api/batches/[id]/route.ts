import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { computeMetrics } from "@/lib/metrics"

// PUT /api/batches/[id] — actualización parcial
const batchUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar 120 caracteres")
    .optional(),
  initialCount: z.coerce
    .number()
    .int("La cantidad inicial debe ser un número entero")
    .min(1, "La cantidad inicial debe ser mayor o igual a 1")
    .optional(),
  startDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha de inicio inválida")
    .optional(),
  status: z.enum(["active", "closed"]).optional(),
  notes: z
    .string()
    .max(1000, "Las notas no pueden superar 1000 caracteres")
    .nullable()
    .optional(),
})

type RouteCtx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteCtx) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const { id } = await params

  try {
    const batch = await db.batch.findFirst({
      where: { id, userId: user.id },
    })
    if (!batch) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      )
    }

    const [expenses, mortality, weighings, sales] = await Promise.all([
      db.expense.findMany({
        where: { batchId: id },
        orderBy: { date: "desc" },
      }),
      db.mortality.findMany({
        where: { batchId: id },
        orderBy: { date: "desc" },
      }),
      db.weighing.findMany({
        where: { batchId: id },
        orderBy: { date: "desc" },
      }),
      db.sale.findMany({
        where: { batchId: id },
        orderBy: { date: "desc" },
      }),
    ])

    const metrics = computeMetrics(
      batch,
      expenses,
      mortality,
      weighings,
      sales
    )

    return NextResponse.json({
      batch,
      metrics,
      expenses,
      mortality,
      weighings,
      sales,
    })
  } catch (err) {
    console.error("GET /api/batches/[id]", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

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

  const parsed = batchUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const data = parsed.data

  try {
    const existing = await db.batch.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      )
    }

    const update: Record<string, unknown> = {}
    if (data.name !== undefined) update.name = data.name
    if (data.initialCount !== undefined) update.initialCount = data.initialCount
    if (data.startDate !== undefined) update.startDate = new Date(data.startDate)
    if (data.status !== undefined) update.status = data.status
    if (data.notes !== undefined) {
      update.notes = data.notes?.trim() ? data.notes.trim() : null
    }

    const updated = await db.batch.update({ where: { id }, data: update })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PUT /api/batches/[id]", err)
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
    const existing = await db.batch.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      )
    }

    // onDelete: Cascade elimina gastos, mortalidad, pesajes y ventas.
    await db.batch.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("DELETE /api/batches/[id]", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
