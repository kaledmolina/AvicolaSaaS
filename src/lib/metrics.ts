// =============================================================================
// Cálculo de métricas dinámicas para un Lote (AvicolaSaaS).
// Recibe las filas crudas devueltas por Prisma (Date objects) y devuelve
// un objeto `BatchMetrics` listo para serializar como JSON.
// =============================================================================

import type { BatchMetrics } from "@/lib/types"

// Tipos "raw" de Prisma: las fechas son Date (no string ISO).
type BatchRow = {
  id: string
  initialCount: number
  startDate: Date
}
type ExpenseRow = { quantity: number; unitPrice: number }
type MortalityRow = { count: number }
type WeighingRow = { date: Date; avgWeight: number }
type SaleRow = { count: number; unitPrice: number }

const DAY_MS = 86_400_000

/**
 * Calcula métricas a partir de las filas ya cargadas del lote.
 * - No hace queries: recibe los arrays ya filtrados por `batchId`.
 * - Es seguro para lote sin datos (devuelve ceros / null donde aplique).
 */
export function computeMetrics(
  batch: BatchRow,
  expenses: ExpenseRow[],
  mortality: MortalityRow[],
  weighings: WeighingRow[],
  sales: SaleRow[]
): BatchMetrics {
  const initialCount = batch.initialCount

  const totalMortality = mortality.reduce((s, m) => s + m.count, 0)
  const totalSold = sales.reduce((s, sa) => s + sa.count, 0)
  const currentPopulation = initialCount - totalMortality - totalSold
  const mortalityRate = initialCount > 0 ? (totalMortality / initialCount) * 100 : 0

  const totalExpenses = expenses.reduce((s, e) => s + e.quantity * e.unitPrice, 0)
  const totalIncome = sales.reduce((s, sa) => s + sa.count * sa.unitPrice, 0)
  const profit = totalIncome - totalExpenses

  const lastWeighing = weighings.length
    ? [...weighings].sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.avgWeight ?? null
    : null

  const daysOld = Math.max(
    0,
    Math.floor((Date.now() - batch.startDate.getTime()) / DAY_MS)
  )

  return {
    batchId: batch.id,
    initialCount,
    totalMortality,
    totalSold,
    currentPopulation,
    mortalityRate,
    totalExpenses,
    totalIncome,
    profit,
    expenseCount: expenses.length,
    saleCount: sales.length,
    weighingCount: weighings.length,
    mortalityCount: mortality.length,
    lastWeighing,
    daysOld,
  }
}
