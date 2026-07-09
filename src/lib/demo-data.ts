import { db } from "@/lib/db"

// Reinicia los datos del usuario demo a un conjunto de muestra realista,
// de modo que cada prueba del sistema comience desde un estado consistente.
// Se invoca en cada login del usuario demo.

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(10, 0, 0, 0)
  return d
}

export async function resetDemoData(userId: string): Promise<void> {
  // Limpia los lotes previos del demo (el cascade elimina gastos/mortalidad/pesajes/ventas)
  await db.batch.deleteMany({ where: { userId } })

  // ---------- Lote 1: activo, en pleno ciclo ----------
  const b1 = await db.batch.create({
    data: {
      userId,
      name: "Galpón A — Lote 12",
      initialCount: 1000,
      startDate: daysAgo(38),
      status: "active",
      notes: "Lote de demostración. Pollitos Ross 308.",
    },
  })

  // Gastos
  await db.expense.createMany({
    data: [
      { batchId: b1.id, description: "Pollitos (compra inicial)", quantity: 1000, unitPrice: 3200, date: daysAgo(38) },
      { batchId: b1.id, description: "Alimento pre-inicio (bultos)", quantity: 20, unitPrice: 52000, date: daysAgo(38) },
      { batchId: b1.id, description: "Alimento inicio (bultos)", quantity: 35, unitPrice: 58000, date: daysAgo(28) },
      { batchId: b1.id, description: "Vacuna Newcastle", quantity: 1000, unitPrice: 450, date: daysAgo(35) },
      { batchId: b1.id, description: "Gas propano (calefacción)", quantity: 2, unitPrice: 85000, date: daysAgo(30) },
      { batchId: b1.id, description: "Alimento engorde (bultos)", quantity: 60, unitPrice: 64000, date: daysAgo(18) },
    ],
  })

  // Mortalidad
  await db.mortality.createMany({
    data: [
      { batchId: b1.id, date: daysAgo(36), count: 8, cause: "Estrés por transporte" },
      { batchId: b1.id, date: daysAgo(30), count: 5, cause: "Ascitis" },
      { batchId: b1.id, date: daysAgo(20), count: 7, cause: "Infarto" },
      { batchId: b1.id, date: daysAgo(10), count: 4, cause: null },
    ],
  })

  // Pesajes (curva de crecimiento)
  await db.weighing.createMany({
    data: [
      { batchId: b1.id, date: daysAgo(35), avgWeight: 95 },
      { batchId: b1.id, date: daysAgo(28), avgWeight: 220 },
      { batchId: b1.id, date: daysAgo(21), avgWeight: 480 },
      { batchId: b1.id, date: daysAgo(14), avgWeight: 880 },
      { batchId: b1.id, date: daysAgo(7), avgWeight: 1450 },
      { batchId: b1.id, date: daysAgo(1), avgWeight: 1980 },
    ],
  })

  // Ventas parciales
  await db.sale.createMany({
    data: [
      { batchId: b1.id, date: daysAgo(5), count: 150, unitPrice: 11000 },
      { batchId: b1.id, date: daysAgo(2), count: 200, unitPrice: 11500 },
    ],
  })

  // ---------- Lote 2: cerrado, ciclo completo ----------
  const b2 = await db.batch.create({
    data: {
      userId,
      name: "Galpón B — Lote 11",
      initialCount: 800,
      startDate: daysAgo(75),
      status: "closed",
      notes: "Ciclo finalizado. Buena rentabilidad.",
    },
  })

  await db.expense.createMany({
    data: [
      { batchId: b2.id, description: "Pollitos (compra inicial)", quantity: 800, unitPrice: 3000, date: daysAgo(75) },
      { batchId: b2.id, description: "Alimento completo ciclo (bultos)", quantity: 110, unitPrice: 60000, date: daysAgo(60) },
      { batchId: b2.id, description: "Medicinas y vitaminas", quantity: 1, unitPrice: 240000, date: daysAgo(50) },
      { batchId: b2.id, description: "Servicios y mano de obra", quantity: 1, unitPrice: 350000, date: daysAgo(40) },
    ],
  })

  await db.mortality.createMany({
    data: [
      { batchId: b2.id, date: daysAgo(70), count: 12, cause: "Estrés térmico" },
      { batchId: b2.id, date: daysAgo(55), count: 9, cause: "Ascitis" },
      { batchId: b2.id, date: daysAgo(40), count: 6, cause: null },
    ],
  })

  await db.weighing.createMany({
    data: [
      { batchId: b2.id, date: daysAgo(70), avgWeight: 90 },
      { batchId: b2.id, date: daysAgo(56), avgWeight: 470 },
      { batchId: b2.id, date: daysAgo(42), avgWeight: 1120 },
      { batchId: b2.id, date: daysAgo(28), avgWeight: 1850 },
      { batchId: b2.id, date: daysAgo(14), avgWeight: 2450 },
    ],
  })

  await db.sale.createMany({
    data: [
      { batchId: b2.id, date: daysAgo(12), count: 500, unitPrice: 12000 },
      { batchId: b2.id, date: daysAgo(11), count: 273, unitPrice: 11800 },
    ],
  })
}
