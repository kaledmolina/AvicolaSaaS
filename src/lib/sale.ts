import type { Sale, SaleUnit } from "@/lib/types"

// Forma mínima necesaria para calcular el ingreso de una venta.
// Acepta tanto el tipo `Sale` (cliente, fechas como string) como filas
// crudas de Prisma (fechas como Date) — los campos usados son iguales.
type SaleLike = {
  unit?: string | null
  count: number
  weight?: number | null
  unitPrice: number
}

/**
 * Calcula el ingreso total de una venta según su modo:
 *  - "unit": cantidad de aves × precio por ave
 *  - "kilo": kilos totales × precio por kilo
 */
export function saleIncome(sale: SaleLike): number {
  if (sale.unit === "kilo") {
    return (sale.weight ?? 0) * sale.unitPrice
  }
  return sale.count * sale.unitPrice
}

export function saleUnitLabel(unit: SaleUnit | string | null | undefined): string {
  return unit === "kilo" ? "Kilo" : "Unidad"
}

export function saleUnitShort(unit: SaleUnit | string | null | undefined): string {
  return unit === "kilo" ? "kilo" : "unit"
}

// Etiqueta legible del precio según el modo.
export function priceLabel(unit: SaleUnit | string | null | undefined): string {
  return unit === "kilo" ? "Precio por kilo" : "Precio por unidad"
}

// Tipo auxiliar para reutilizar `Sale` con el campo `unit` garantizado.
export type SaleWithUnit = Sale
