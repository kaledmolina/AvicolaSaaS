"use client"

// =============================================================================
// Hooks de TanStack Query para Lotes y entidades hijas (AvícolaSaaS).
// Cada mutación invalida qk.batches y qk.batchDetail(batchId) según corresponda.
// Los componentes llamadores son responsables de mostrar los toasts (try/catch
// alrededor de mutateAsync) — manteniendo una convención consistente.
// =============================================================================

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/queries"
import type {
  Batch,
  BatchDetail,
  BatchInput,
  Expense,
  ExpenseInput,
  Mortality,
  MortalityInput,
  Sale,
  SaleInput,
  Weighing,
  WeighingInput,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// Lotes
// ---------------------------------------------------------------------------

export function useBatches() {
  return useQuery<Batch[]>({
    queryKey: qk.batches,
    queryFn: () => api.get<Batch[]>("/api/batches"),
  })
}

export function useBatchDetail(batchId: string | null | undefined) {
  return useQuery<BatchDetail>({
    queryKey: qk.batchDetail(batchId ?? ""),
    queryFn: () => api.get<BatchDetail>(`/api/batches/${batchId}`),
    enabled: !!batchId,
  })
}

export function useCreateBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BatchInput) =>
      api.post<Batch>("/api/batches", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useUpdateBatch(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<BatchInput>) =>
      api.put<Batch>(`/api/batches/${batchId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batches })
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
    },
  })
}

export function useDeleteBatch(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.del<void>(`/api/batches/${batchId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batches })
      qc.removeQueries({ queryKey: qk.batchDetail(batchId) })
    },
  })
}

// ---------------------------------------------------------------------------
// Gastos
// ---------------------------------------------------------------------------

export function useCreateExpense(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ExpenseInput) =>
      api.post<Expense>(`/api/batches/${batchId}/expenses`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useUpdateExpense(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ExpenseInput> }) =>
      api.put<Expense>(`/api/expenses/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useDeleteExpense(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

// ---------------------------------------------------------------------------
// Mortalidad
// ---------------------------------------------------------------------------

export function useCreateMortality(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MortalityInput) =>
      api.post<Mortality>(`/api/batches/${batchId}/mortality`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useUpdateMortality(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<MortalityInput>
    }) => api.put<Mortality>(`/api/mortality/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useDeleteMortality(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/mortality/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

// ---------------------------------------------------------------------------
// Pesajes
// ---------------------------------------------------------------------------

export function useCreateWeighing(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: WeighingInput) =>
      api.post<Weighing>(`/api/batches/${batchId}/weighings`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useUpdateWeighing(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<WeighingInput>
    }) => api.put<Weighing>(`/api/weighings/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useDeleteWeighing(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/weighings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

export function useCreateSale(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SaleInput) =>
      api.post<Sale>(`/api/batches/${batchId}/sales`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useUpdateSale(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SaleInput> }) =>
      api.put<Sale>(`/api/sales/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}

export function useDeleteSale(batchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/sales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.batchDetail(batchId) })
      qc.invalidateQueries({ queryKey: qk.batches })
    },
  })
}
