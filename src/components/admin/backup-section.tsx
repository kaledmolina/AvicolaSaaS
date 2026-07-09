"use client"

// =============================================================================
// Sección de Copia de Seguridad / Restauración para el Panel de Super-Admin.
// AvícolaSaaS — SQLite single-file backup & restore.
//
// Dos sub-secciones dentro de una Card:
//   1. Descargar copia (.db actual) → blob download via useDownloadBackup().
//   2. Restaurar copia (subir .db) → AlertDialog de confirmación (destructiva)
//      + Alert de éxito con botón "Recargar página" (la BD se reconecta al
//      recargar porque el restore cierra la conexión Prisma).
//
// Tema naranja (primary). Acciones destructivas marcadas. Loading states.
// =============================================================================

import * as React from "react"
import {
  DatabaseBackup,
  Download,
  HardDriveDownload,
  Loader2,
  RefreshCw,
  TriangleAlert,
  Upload,
} from "lucide-react"

import { ApiError } from "@/lib/api"
import { useDownloadBackup, useRestoreBackup } from "@/hooks/use-backup"
import { useToast } from "@/hooks/use-toast"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function BackupSection() {
  const { toast } = useToast()
  const downloadBackup = useDownloadBackup()
  const restoreBackup = useRestoreBackup()

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [restoreMessage, setRestoreMessage] = React.useState<string | null>(
    null,
  )

  // -------------------------------------------------------------------------
  // Descarga
  // -------------------------------------------------------------------------
  async function handleDownload() {
    try {
      const result = await downloadBackup.mutateAsync()
      toast({
        title: "Copia de seguridad descargada",
        description: result.filename,
      })
    } catch (err) {
      toast({
        title: "No se pudo descargar la copia",
        description:
          err instanceof ApiError
            ? err.message
            : "Ocurrió un error inesperado. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  // -------------------------------------------------------------------------
  // Selección de archivo
  // -------------------------------------------------------------------------
  function handleSelectFileClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setRestoreMessage(null)
    // Resetear el value permite re-seleccionar el mismo archivo después.
    e.target.value = ""
  }

  function handleClearFile() {
    setSelectedFile(null)
    setRestoreMessage(null)
  }

  // -------------------------------------------------------------------------
  // Restauración
  // -------------------------------------------------------------------------
  function handleRestoreClick() {
    if (!selectedFile) return
    setConfirmOpen(true)
  }

  async function performRestore() {
    if (!selectedFile) return
    try {
      const result = await restoreBackup.mutateAsync(selectedFile)
      setRestoreMessage(result.message)
      setConfirmOpen(false)
      toast({
        title: "Base de datos restaurada",
        description: "Recarga la página para completar el proceso.",
      })
    } catch (err) {
      toast({
        title: "No se pudo restaurar",
        description:
          err instanceof ApiError
            ? err.message
            : "Ocurrió un error inesperado. Intenta nuevamente.",
        variant: "destructive",
      })
      setConfirmOpen(false)
    }
  }

  const isRestoring = restoreBackup.isPending
  const isDownloading = downloadBackup.isPending

  return (
    <Card className="mt-8">
      {/* Encabezado de la card */}
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DatabaseBackup className="size-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-lg">Copia de Seguridad</CardTitle>
            <CardDescription>
              Descarga o restaura la base de datos completa de AvícolaSaaS en
              formato SQLite (.db).
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* ----------------------------------------------------------------- */}
        {/* PARTE 1 — Descargar copia                                         */}
        {/* ----------------------------------------------------------------- */}
        <section
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
          aria-labelledby="backup-download-title"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <HardDriveDownload className="size-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <h3
                id="backup-download-title"
                className="text-sm font-semibold text-foreground"
              >
                Descargar copia
              </h3>
              <p className="text-sm text-muted-foreground">
                Descarga una copia completa de la base de datos actual en
                formato SQLite (.db). Puedes guardarla como respaldo o
                transferirla a otro servidor.
              </p>
              <p className="text-xs text-muted-foreground">
                El archivo incluye todos los usuarios, lotes y registros.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full sm:w-auto"
              aria-label="Descargar copia de seguridad de la base de datos"
            >
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {isDownloading ? "Descargando…" : "Descargar copia de seguridad"}
            </Button>
          </div>
        </section>

        <Separator />

        {/* ----------------------------------------------------------------- */}
        {/* PARTE 2 — Restaurar copia                                         */}
        {/* ----------------------------------------------------------------- */}
        <section
          className="flex flex-col gap-4"
          aria-labelledby="backup-restore-title"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
            >
              <Upload className="size-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <h3
                id="backup-restore-title"
                className="text-sm font-semibold text-foreground"
              >
                Restaurar copia
              </h3>
              <p className="text-sm text-muted-foreground">
                Restaura la base de datos desde un archivo .db previamente
                descargado.{" "}
                <strong className="text-foreground">
                  Esta acción REEMPLAZA todos los datos actuales.
                </strong>
              </p>
            </div>
          </div>

          {/* Input de archivo oculto + UI controlada */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".db,application/octet-stream"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Seleccionar archivo de base de datos .db para restaurar"
            data-testid="backup-file-input"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectFileClick}
              disabled={isRestoring}
              className="w-full sm:w-auto"
            >
              <Upload className="size-4" />
              Seleccionar archivo .db
            </Button>

            {selectedFile ? (
              <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
                <span className="truncate font-medium text-foreground">
                  {selectedFile.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  ({formatBytes(selectedFile.size)})
                </span>
                <button
                  type="button"
                  onClick={handleClearFile}
                  disabled={isRestoring}
                  aria-label="Quitar archivo seleccionado"
                  className="ml-1 shrink-0 rounded-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <TriangleAlert className="size-3.5" aria-hidden />
                  <span className="sr-only">Quitar archivo</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Ningún archivo seleccionado.
              </span>
            )}

            <Button
              type="button"
              variant="destructive"
              onClick={handleRestoreClick}
              disabled={!selectedFile || isRestoring}
              className="w-full sm:ml-auto sm:w-auto"
              aria-label="Restaurar base de datos desde el archivo seleccionado"
            >
              {isRestoring ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {isRestoring ? "Restaurando…" : "Restaurar base de datos"}
            </Button>
          </div>

          {/* Mensaje de éxito tras restaurar — debe ser MUY visible */}
          {restoreMessage && (
            <Alert
              role="status"
              aria-live="polite"
              className="border-primary/40 bg-primary/5"
            >
              <RefreshCw className="size-4 text-primary" aria-hidden />
              <AlertTitle className="text-primary">
                Restauración completada
              </AlertTitle>
              <AlertDescription>
                <div className="flex flex-col gap-3">
                  <p>{restoreMessage}</p>
                  <p className="text-sm">
                    La conexión a la base de datos se cerró durante la
                    restauración.{" "}
                    <strong className="text-foreground">
                      Debes recargar la página
                    </strong>{" "}
                    para reconectar y ver los datos restaurados. El servidor de
                    desarrollo puede tardar unos segundos en responder.
                  </p>
                  <div>
                    <Button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="w-full sm:w-auto"
                    >
                      <RefreshCw className="size-4" />
                      Recargar página
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </section>
      </CardContent>

      {/* ----------------------------------------------------------------- */}
      {/* Diálogo de confirmación (acción destructiva)                     */}
      {/* ----------------------------------------------------------------- */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert
                className="size-5 text-destructive"
                aria-hidden
              />
              ¿Restaurar base de datos?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <span>
                Se reemplazarán <strong>TODOS</strong> los datos actuales por
                los del archivo seleccionado. Esta acción{" "}
                <strong>no se puede deshacer</strong>. Asegúrate de tener una
                copia de seguridad reciente antes de continuar.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedFile && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Archivo seleccionado
              </p>
              <p className="mt-0.5 truncate font-medium text-foreground">
                {selectedFile.name}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({formatBytes(selectedFile.size)})
                </span>
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              Cancelar
            </AlertDialogCancel>
            {/* Usamos un Button normal (no AlertDialogAction) para mantener el
                diálogo abierto durante la petición y mostrar el spinner. */}
            <Button
              type="button"
              variant="destructive"
              disabled={isRestoring}
              onClick={() => void performRestore()}
            >
              {isRestoring && <Loader2 className="size-4 animate-spin" />}
              Sí, restaurar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default BackupSection
