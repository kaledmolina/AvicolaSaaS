import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { computeMetrics } from "@/lib/metrics"
import type { AdminUserSummary } from "@/lib/types"

// GET /api/admin/users → lista todos los usuarios con métricas agregadas.
export async function GET() {
  const guard = await requireAdmin()
  if ("response" in guard) return guard.response

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabled: true,
      createdAt: true,
      batches: {
        select: {
          initialCount: true,
          expenses: { select: { quantity: true, unitPrice: true } },
          mortality: { select: { count: true } },
          sales: { select: { count: true, unit: true, weight: true, unitPrice: true } },
        },
      },
    },
  })

  const result: AdminUserSummary[] = users.map((u) => {
    let totalInitial = 0
    let totalMortality = 0
    let totalSold = 0
    let totalExpenses = 0
    let totalIncome = 0
    for (const b of u.batches) {
      totalInitial += b.initialCount
      totalMortality += b.mortality.reduce((s, m) => s + m.count, 0)
      totalSold += b.sales.reduce((s, s2) => s + s2.count, 0)
      totalExpenses += b.expenses.reduce((s, e) => s + e.quantity * e.unitPrice, 0)
      totalIncome += b.sales.reduce(
        (s, s2) =>
          s +
          (s2.unit === "kilo"
            ? (s2.weight ?? 0) * s2.unitPrice
            : s2.count * s2.unitPrice),
        0
      )
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as "user" | "admin",
      disabled: u.disabled,
      createdAt: u.createdAt.toISOString(),
      batchCount: u.batches.length,
      totalInitial,
      currentPopulation: totalInitial - totalMortality - totalSold,
      totalExpenses,
      totalIncome,
      profit: totalIncome - totalExpenses,
    }
  })

  return NextResponse.json(result)
}
