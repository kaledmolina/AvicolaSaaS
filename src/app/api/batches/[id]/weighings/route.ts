import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

const weighingInputSchema = z.object({
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida"),
  avgWeight: z.coerce
    .number()
    .positive("El peso promedio debe ser mayor a 0"),
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

    const weighings = await db.weighing.findMany({
      where: { batchId: id },
      orderBy: { date: "desc" },
    })
    return NextResponse.json(weighings)
  } catch (err) {
    console.error("GET /api/batches/[id]/weighings", err)
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

  const parsed = weighingInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }
  const { date, avgWeight } = parsed.data

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

    const weighing = await db.weighing.create({
      data: {
        batchId: id,
        date: new Date(date),
        avgWeight,
      },
    })
    return NextResponse.json(weighing, { status: 201 })
  } catch (err) {
    console.error("POST /api/batches/[id]/weighings", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
