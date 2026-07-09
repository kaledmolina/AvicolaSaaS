"use client"

// =============================================================================
// Hooks de TanStack Query para Copia de Seguridad / Restauración (Admin).
// AvícolaSaaS — SQLite single-file backup & restore.
//
// - useDownloadBackup(): descarga el archivo .db actual como binario.
//   No usamos `api.get` porque la respuesta NO es JSON. Hacemos fetch directo,
//   leemos el body como Blob y disparamos la descarga con un <a> temporal +
//   URL.createObjectURL (no navega la página). El nombre del archivo se lee
//   del header Content-Disposition. Las cookies de NextAuth viajan solas
//   (same-origin).
//
// - useRestoreBackup(): sube un File (.db) como multipart/form-data al
//   endpoint de restauración. Invalida qk.adminUsers al terminar OK para que
//   un futuro reload traiga la lista fresca.
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api"
import { qk } from "@/lib/queries"

// ---------------------------------------------------------------------------
// Tipos del contrato API (ver /api/admin/backup/**)
// ---------------------------------------------------------------------------

export interface DownloadBackupResult {
  filename: string
  size: number
}

export interface RestoreBackupResult {
  success: boolean
  message: string
  size: number
}

// ---------------------------------------------------------------------------
// Helpers internos: parseo robusto de errores JSON del backend
// ---------------------------------------------------------------------------

async function readApiError(res: Response, fallbackStatus?: number): Promise<ApiError> {
  let message = `Error ${res.status}`
  try {
    const data = await res.json()
    message = data.error || data.message || message
  } catch {
    /* el cuerpo no era JSON — mantenemos el mensaje genérico */
  }
  if (res.status === 401) message = "Debes iniciar sesión para continuar"
  else if (res.status === 403) message = "No tienes permisos de administrador"
  return new ApiError(message, fallbackStatus ?? res.status)
}

// ---------------------------------------------------------------------------
// Descarga de copia de seguridad
// ---------------------------------------------------------------------------

async function downloadBackup(): Promise<DownloadBackupResult> {
  let res: Response
  try {
    res = await fetch("/api/admin/backup", { method: "GET" })
  } catch {
    // Error de red / servidor caído (típico justo después de un restore
    // que cierra la conexión Prisma).
    throw new ApiError(
      "No se pudo conectar con el servidor. Si acabas de restaurar, recarga la página e inténtalo de nuevo.",
      0,
    )
  }

  if (!res.ok) throw await readApiError(res)

  const blob = await res.blob()

  // Nombre del archivo desde Content-Disposition:
  //   attachment; filename="backup-avicola-YYYYMMDDHHmmss.db"
  const cd = res.headers.get("Content-Disposition") || ""
  const match = cd.match(/filename="?([^";]+)"?/i)
  const filename = match?.[1] || `backup-avicola-${Date.now()}.db`

  // Disparar descarga sin navegar la página.
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revocar tras un breve delay (Safari necesita que el URL siga vivo un instante).
  setTimeout(() => URL.revokeObjectURL(url), 1500)

  return { filename, size: blob.size }
}

export function useDownloadBackup() {
  return useMutation<DownloadBackupResult, ApiError, void>({
    mutationFn: downloadBackup,
  })
}

// ---------------------------------------------------------------------------
// Restauración de copia de seguridad
// ---------------------------------------------------------------------------

async function restoreBackup(file: File): Promise<RestoreBackupResult> {
  const formData = new FormData()
  formData.append("file", file)

  let res: Response
  try {
    res = await fetch("/api/admin/backup/restore", {
      method: "POST",
      body: formData,
      // NO setear Content-Type: el navegador define el boundary multipart
      // automáticamente al usar FormData.
    })
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Recarga la página e inténtalo de nuevo.",
      0,
    )
  }

  if (!res.ok) throw await readApiError(res)

  return (await res.json()) as RestoreBackupResult
}

export function useRestoreBackup() {
  const qc = useQueryClient()
  return useMutation<RestoreBackupResult, ApiError, File>({
    mutationFn: restoreBackup,
    onSuccess: () => {
      // La conexión Prisma se cerró durante el restore, así que este
      // refetch probablemente falle hasta que la página se recargue. Aun así
      // invalidamos para que el siguiente montaje traiga datos frescos.
      qc.invalidateQueries({ queryKey: qk.adminUsers })
    },
  })
}
