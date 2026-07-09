"use client"

import * as React from "react"
import {
  Bird,
  CircleCheck,
  FolderClosed,
  Loader2,
  Plus,
  Users,
} from "lucide-react"

import { formatNumber } from "@/lib/format"
import type { Batch } from "@/lib/types"
import { useBatches } from "@/hooks/use-batches"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BatchCard } from "@/components/dashboard/batch-card"
import { BatchFormDialog } from "@/components/dashboard/batch-form-dialog"

export function Dashboard() {
  const { data: batches, isLoading, isError } = useBatches()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editBatch, setEditBatch] = React.useState<Batch | null>(null)

  const list = batches ?? []

  const activeCount = list.filter((b) => b.status === "active").length
  const closedCount = list.filter((b) => b.status === "closed").length
  const totalInitial = list.reduce((s, b) => s + b.initialCount, 0)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Mis Lotes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tus lotes de pollos de engorde, gastos, mortalidad, pesajes
            y ventas.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-10"
          size="lg"
        >
          <Plus className="size-4" />
          Nuevo lote
        </Button>
      </div>

      {/* KPIs agregados */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          label="Total de lotes"
          value={formatNumber(list.length)}
          icon={<Bird className="size-4" />}
          tone="primary"
        />
        <KpiTile
          label="Activos"
          value={formatNumber(activeCount)}
          icon={<CircleCheck className="size-4" />}
          tone="primary"
        />
        <KpiTile
          label="Cerrados"
          value={formatNumber(closedCount)}
          icon={<FolderClosed className="size-4" />}
          tone="muted"
        />
        <KpiTile
          label="Aves iniciales"
          value={formatNumber(totalInitial)}
          icon={<Users className="size-4" />}
          tone="primary"
        />
      </div>

      {/* Grid de lotes */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm text-destructive">
                No se pudieron cargar tus lotes. Intenta nuevamente.
              </p>
              <Button variant="outline" onClick={() => location.reload()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : list.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => (
              <BatchCard
                key={b.id}
                batch={b}
                onEdit={(batch) => setEditBatch(batch)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Diálogos */}
      <BatchFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <BatchFormDialog
        open={!!editBatch}
        onOpenChange={(o) => !o && setEditBatch(null)}
        batch={editBatch ?? undefined}
      />

      {/* Indicador sutil de carga en acciones */}
      {isLoading && (
        <span className="sr-only" aria-live="polite">
          <Loader2 className="size-4 animate-spin" />
          Cargando lotes…
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pieza de KPI
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
  tone?: "primary" | "muted"
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 px-4 py-4">
        <span
          className={
            "flex size-9 shrink-0 items-center justify-center rounded-lg " +
            (tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground")
          }
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

// ---------------------------------------------------------------------------
// Estado vacío
// ---------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed py-0">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bird className="size-7" />
        </span>
        <div>
          <p className="text-base font-semibold">Aún no tienes lotes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primer lote para empezar a registrar la producción.
          </p>
        </div>
        <Button onClick={onCreate} className="mt-2 h-10">
          <Plus className="size-4" />
          Crear primer lote
        </Button>
      </CardContent>
    </Card>
  )
}
