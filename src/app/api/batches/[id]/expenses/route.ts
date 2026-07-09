import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

const expenseInputSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(200, "La descripción no puede superar 200 caracteres"),
  quantity: z.coerce
    .number()
    .positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.coerce
    .number()
    .min(0, "El precio unitario debe ser mayor o igual a 0"),
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida"),
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

    const expenses = await db.expense.findMany({
      where: { batchId: id },
      orderBy: { date: "desc" },
    })
    return NextResponse.json(expenses)
  } catch (err) {
    console.error("GET /api/batches/[id]/expenses", err)
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

  const parsed = expenseInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const { description, quantity, unitPrice, date } = parsed.data

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

    const expense = await db.expense.create({
      data: {
        batchId: id,
        description,
        quantity,
        unitPrice,
        date: new Date(date),
      },
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (err) {
    console.error("POST /api/batches/[id]/expenses", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
