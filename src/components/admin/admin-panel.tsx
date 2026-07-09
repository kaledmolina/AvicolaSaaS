"use client"

// =============================================================================
// Panel principal del Super-Admin (AvícolaSaaS).
// Se renderiza dentro del <main> del AppShell. Lista usuarios con KPIs
// agregados y permite abrir el diálogo de detalle por usuario.
// =============================================================================

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowLeft,
  Bird,
  CheckCircle2,
  Loader2,
  PowerOff,
  Users,
} from "lucide-react"

import { formatNumber } from "@/lib/format"
import { useAdminUsers } from "@/hooks/use-admin"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminUsersTable } from "@/components/admin/admin-users-table"
import { AdminUserDetailDialog } from "@/components/admin/admin-user-detail-dialog"
import { BackupSection } from "@/components/admin/backup-section"

export function AdminPanel() {
  const router = useRouter()
  const { data: session } = useSession()
  // session.user.id se adjunta en runtime (callback session de NextAuth),
  // pero el tipo por defecto de next-auth no lo incluye. Lo leemos con un cast seguro.
  const currentUserId =
    (session?.user as { id?: string } | undefined)?.id ?? ""

  const { data: users, isLoading, isError } = useAdminUsers()
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const list = users ?? []
  const activeCount = list.filter((u) => !u.disabled).length
  const disabledCount = list.filter((u) => u.disabled).length
  const totalBatches = list.reduce((s, u) => s + u.batchCount, 0)

  function handleViewDetails(userId: string) {
    setSelectedUserId(userId)
    setDetailOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Encabezado */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/")}
        className="mb-3 -ml-2"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Button>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Panel de Administración
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los usuarios de la plataforma.
        </p>
      </header>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          label="Usuarios totales"
          value={formatNumber(list.length)}
          icon={<Users className="size-4" />}
          tone="primary"
        />
        <KpiTile
          label="Activos"
          value={formatNumber(activeCount)}
          icon={<CheckCircle2 className="size-4" />}
          tone="primary"
        />
        <KpiTile
          label="Desactivados"
          value={formatNumber(disabledCount)}
          icon={<PowerOff className="size-4" />}
          tone="destructive"
        />
        <KpiTile
          label="Lotes totales"
          value={formatNumber(totalBatches)}
          icon={<Bird className="size-4" />}
          tone="muted"
        />
      </div>

      {/* Tabla */}
      <div className="mt-6">
        {isLoading ? (
          <Card className="py-0">
            <CardContent className="p-0">
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="py-0">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-destructive">
                No se pudieron cargar los usuarios.
              </p>
              <Button variant="outline" onClick={() => location.reload()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AdminUsersTable
            users={list}
            currentUserId={currentUserId}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>

      {/* Copia de seguridad / Restauración */}
      <BackupSection />

      {/* Diálogo de detalle */}
      <AdminUserDetailDialog
        userId={selectedUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Indicador accesible de carga */}
      {isLoading && (
        <span className="sr-only" aria-live="polite">
          <Loader2 className="size-4 animate-spin" />
          Cargando usuarios…
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pieza KPI (mismo estilo que el dashboard pero con tono destructive)
// ---------------------------------------------------------------------------

function KpiTile({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone?: "primary" | "destructive" | "muted"
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground"
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 px-4 py-4">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminPanel
