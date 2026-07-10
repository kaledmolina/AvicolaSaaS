"use client"

// =============================================================================
// Hooks de TanStack Query para el Panel de Super-Admin (AvícolaSaaS).
// Lecturas: lista de usuarios y detalle de usuario.
// Mutaciones: alternar estado `disabled` y cambiar `role` (PATCH).
// El helper `api` no expone PATCH, por eso se usa `fetch` directo aquí.
// Los componentes llamadores muestran los toasts en try/catch.
// =============================================================================

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { ApiError, api } from "@/lib/api"
import { qk } from "@/lib/queries"
import type {
  AdminUserDetail,
  AdminUserSummary,
  UserRole,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export function useAdminUsers() {
  return useQuery<AdminUserSummary[]>({
    queryKey: qk.adminUsers,
    queryFn: () => api.get<AdminUserSummary[]>("/api/admin/users"),
  })
}

export function useAdminUser(id: string | null | undefined) {
  return useQuery<AdminUserDetail>({
    queryKey: qk.adminUser(id ?? ""),
    queryFn: () => api.get<AdminUserDetail>(`/api/admin/users/${id}`),
    enabled: !!id,
  })
}

// ---------------------------------------------------------------------------
// PATCH helper (api solo expone get/post/put/del)
// ---------------------------------------------------------------------------

interface PatchUserBody {
  disabled?: boolean
  role?: UserRole
}

interface PatchUserResult {
  id: string
  disabled: boolean
  role: UserRole
}

async function patchUser(
  id: string,
  body: PatchUserBody
): Promise<PatchUserResult> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const data = await res.json()
      message = data.error || data.message || message
    } catch {
      /* ignore */
    }
    if (res.status === 401) message = "Debes iniciar sesión para continuar"
    throw new ApiError(message, res.status)
  }
  if (res.status === 204) {
    return { id, disabled: !!body.disabled, role: (body.role ?? "user") as UserRole }
  }
  return res.json() as Promise<PatchUserResult>
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

export function useToggleUserDisabled() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, disabled }: { id: string; disabled: boolean }) =>
      patchUser(id, { disabled }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: qk.adminUsers })
      qc.invalidateQueries({ queryKey: qk.adminUser(data.id) })
    },
  })
}

export function useSetUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      patchUser(id, { role }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: qk.adminUsers })
      qc.invalidateQueries({ queryKey: qk.adminUser(data.id) })
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminUsers })
    },
  })
}
