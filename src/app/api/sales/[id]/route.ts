import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

const saleUpdateSchema = z
  .object({
    date: z
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida")
      .optional(),
    count: z.coerce
      .number()
      .int("La cantidad debe ser un número entero")
      .min(1, "La cantidad debe ser mayor o igual a 1")
      .optional(),
    unit: z.enum(["unit", "kilo"]).optional(),
    weight: z.coerce
      .number()
      .min(0, "El peso debe ser mayor o igual a 0")
      .optional()
      .nullable(),
    unitPrice: z.coerce
      .number()
      .min(0, "El precio debe ser mayor o igual a 0")
      .optional(),
  })
  .refine(
    (d) =>
      d.unit !== "kilo" ||
      (typeof d.weight === "number" && d.weight > 0) ||
      (d.weight === undefined),
    { message: "Para venta por kilo, el peso total (kg) debe ser mayor a 0" }
  )

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

  const parsed = saleUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const data = parsed.data

  try {
    const sale = await db.sale.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!sale || sale.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    const update: Record<string, unknown> = {}
    if (data.date !== undefined) update.date = new Date(data.date)
    if (data.count !== undefined) update.count = data.count
    if (data.unit !== undefined) update.unit = data.unit
    if (data.weight !== undefined) update.weight = data.weight
    if (data.unitPrice !== undefined) update.unitPrice = data.unitPrice

    // Si se cambia el modo a "unit", limpiar el peso; si es "kilo", asegurar peso.
    if (data.unit === "unit") update.weight = null
    if (data.unit === "kilo" && update.weight === undefined) {
      // mantener el peso existente si no se envió
      delete update.weight
    }

    const updated = await db.sale.update({ where: { id }, data: update })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("PUT /api/sales/[id]", err)
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
    const sale = await db.sale.findUnique({
      where: { id },
      include: { batch: { select: { userId: true } } },
    })
    if (!sale || sale.batch.userId !== user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    await db.sale.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("DELETE /api/sales/[id]", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
