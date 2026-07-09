// Utilidades de formato: moneda (COP), números, fechas y porcentajes.

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 })

export function formatMoney(value: number): string {
  if (!isFinite(value)) return "$0"
  return cop.format(value)
}

export function formatNumber(value: number): string {
  if (!isFinite(value)) return "0"
  return num.format(value)
}

export function formatPercent(value: number): string {
  if (!isFinite(value)) return "0%"
  return `${num.format(value)}%`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  })
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Bogota",
  })
}

export function toInputDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 10)
}

export function todayInputDate(): string {
  return new Date().toISOString().slice(0, 10)
}
