import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { computeMetrics } from "@/lib/metrics"
import { ADMIN_EMAIL, DEMO_EMAIL } from "@/lib/accounts"
import type { AdminUserDetail } from "@/lib/types"

// GET /api/admin/users/[id] → detalle de un usuario con sus lotes y métricas.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if ("response" in guard) return guard.response

  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabled: true,
      createdAt: true,
      batches: {
        orderBy: { createdAt: "desc" },
        include: {
          expenses: { orderBy: { date: "desc" } },
          mortality: { orderBy: { date: "desc" } },
          weighings: { orderBy: { date: "desc" } },
          sales: { orderBy: { date: "desc" } },
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  const batches = user.batches.map((b) => ({
    batch: {
      ...b,
      startDate: b.startDate.toISOString(),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      expenses: b.expenses.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      mortality: b.mortality.map((m) => ({
        ...m,
        date: m.date.toISOString(),
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      weighings: b.weighings.map((w) => ({
        ...w,
        date: w.date.toISOString(),
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
      sales: b.sales.map((s) => ({
        ...s,
        date: s.date.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    },
    metrics: computeMetrics(
      {
        id: b.id,
        userId: b.userId,
        name: b.name,
        initialCount: b.initialCount,
        startDate: b.startDate,
        status: b.status,
        notes: b.notes,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      },
      b.expenses,
      b.mortality,
      b.weighings,
      b.sales
    ),
  }))

  const result: AdminUserDetail = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "user" | "admin",
      disabled: user.disabled,
      createdAt: user.createdAt.toISOString(),
    },
    batches,
  }

  return NextResponse.json(result)
}

const updateSchema = z.object({
  disabled: z.boolean().optional(),
  role: z.enum(["user", "admin"]).optional(),
})

// PATCH /api/admin/users/[id] → activar/desactivar o cambiar rol.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if ("response" in guard) return guard.response
  const admin = guard.user

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  const target = await db.user.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // Protecciones: no auto-desactivarse ni auto-degradarse (evita lockout)
  if (id === admin.id) {
    if (parsed.data.disabled === true || parsed.data.role === "user") {
      return NextResponse.json(
        { error: "No puedes desactivar ni degradar tu propia cuenta de administrador" },
        { status: 400 }
      )
    }
  }

  const data: { disabled?: boolean; role?: string } = {}
  if (parsed.data.disabled !== undefined) data.disabled = parsed.data.disabled
  if (parsed.data.role !== undefined) data.role = parsed.data.role

  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, disabled: true, role: true },
  })

  // Si se desactiva al usuario demo, se reactiva automáticamente (no se puede bloquear el demo)
  if (updated.disabled && target.email === DEMO_EMAIL) {
    await db.user.update({ where: { id }, data: { disabled: false } })
    return NextResponse.json({ id, disabled: false, role: updated.role })
  }

  return NextResponse.json(updated)
}
