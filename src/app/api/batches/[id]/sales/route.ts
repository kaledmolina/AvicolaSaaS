import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

const saleInputSchema = z.object({
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida"),
  count: z.coerce
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad debe ser mayor o igual a 1"),
  unitPrice: z.coerce
    .number()
    .min(0, "El precio unitario debe ser mayor o igual a 0"),
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
      select: { id: true },
    })
    if (!batch) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      )
    }

    const sales = await db.sale.findMany({
      where: { batchId: id },
      orderBy: { date: "desc" },
    })
    return NextResponse.json(sales)
  } catch (err) {
    console.error("GET /api/batches/[id]/sales", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: RouteCtx) {
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

  const parsed = saleInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const { date, count, unitPrice } = parsed.data

  try {
    const batch = await db.batch.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!batch) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      )
    }

    const sale = await db.sale.create({
      data: {
        batchId: id,
        date: new Date(date),
        count,
        unitPrice,
      },
    })
    return NextResponse.json(sale, { status: 201 })
  } catch (err) {
    console.error("POST /api/batches/[id]/sales", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
