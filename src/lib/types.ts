// =============================================================================
// Contrato de tipos compartido entre frontend y backend (AvicolaSaaS)
// Todas las entidades de datos del sistema de gestión avícola.
// =============================================================================

// ---- Entidades base (tal como llegan/van del API) ----

export type UserRole = "user" | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  disabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Batch {
  id: string
  userId: string
  name: string
  initialCount: number
  startDate: string // ISO
  status: "active" | "closed"
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  batchId: string
  description: string
  quantity: number
  unitPrice: number
  date: string // ISO
  createdAt: string
  updatedAt: string
}

export interface Mortality {
  id: string
  batchId: string
  date: string // ISO
  count: number
  cause: string | null
  createdAt: string
  updatedAt: string
}

export interface Weighing {
  id: string
  batchId: string
  date: string // ISO
  avgWeight: number // gramos
  createdAt: string
  updatedAt: string
}

export type SaleUnit = "unit" | "kilo"

export interface Sale {
  id: string
  batchId: string
  date: string // ISO
  count: number
  unit: SaleUnit
  weight: number | null // kilos totales vendidos (presente si unit = "kilo")
  unitPrice: number // precio por unidad (unit) o por kilo (kilo)
  createdAt: string
  updatedAt: string
}

// ---- DTOs de entrada (payloads de creación/edición) ----

export interface BatchInput {
  name: string
  initialCount: number
  startDate: string // ISO
  status?: "active" | "closed"
  notes?: string | null
}

export interface ExpenseInput {
  description: string
  quantity: number
  unitPrice: number
  date: string // ISO
}

export interface MortalityInput {
  date: string // ISO
  count: number
  cause?: string | null
}

export interface WeighingInput {
  date: string // ISO
  avgWeight: number
}

export interface SaleInput {
  date: string // ISO
  count: number
  unit?: SaleUnit
  weight?: number | null // kilos (requerido si unit = "kilo")
  unitPrice: number
}

// ---- Métricas dinámicas calculadas para un Lote ----

export interface BatchMetrics {
  batchId: string
  initialCount: number
  totalMortality: number
  totalSold: number
  currentPopulation: number // vivos = inicial - muertos - vendidos
  mortalityRate: number // % (muertos / inicial) * 100
  totalExpenses: number // sumatoria de gastos
  totalIncome: number // sumatoria de ventas (count * unitPrice)
  profit: number // ingresos - gastos
  expenseCount: number
  saleCount: number
  weighingCount: number
  mortalityCount: number
  lastWeighing: number | null // gramos del último pesaje
  daysOld: number // días transcurridos desde startDate
}

// ---- Vista detallada del lote con sus registros ----

export interface BatchDetail {
  batch: Batch
  metrics: BatchMetrics
  expenses: Expense[]
  mortality: Mortality[]
  weighings: Weighing[]
  sales: Sale[]
}

// ---- Helpers de respuesta estándar ----

export interface ApiError {
  error: string
}

// ---- Super Admin ----

export interface AdminUserSummary {
  id: string
  name: string
  email: string
  role: UserRole
  disabled: boolean
  createdAt: string
  batchCount: number
  totalInitial: number
  currentPopulation: number
  totalExpenses: number
  totalIncome: number
  profit: number
}

export interface AdminBatchWithMetrics {
  batch: Batch
  metrics: BatchMetrics
}

export interface AdminUserDetail {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    disabled: boolean
    createdAt: string
  }
  batches: AdminBatchWithMetrics[]
}

export interface AdminUserUpdate {
  disabled?: boolean
  role?: UserRole
}
