"use client"

// =============================================================================
// Diálogo de detalle de usuario para el Panel de Super-Admin (AvícolaSaaS).
// Recibe el userId + estado open; carga AdminUserDetail y muestra KPIs
// agregados + lista de lotes con métricas individuales.
// =============================================================================

import * as React from "react"
import {
  Bird,
  CalendarDays,
  CheckCircle2,
  Coins,
  PowerOff,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

import { ApiError } from "@/lib/api"
import {
  formatDate,
  formatDateShort,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format"
import type { AdminBatchWithMetrics, AdminUserDetail } from "@/lib/types"
import { useAdminUser } from "@/hooks/use-admin"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface AdminUserDetailDialogProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminUserDetailDialog({
  userId,
  open,
  onOpenChange,
}: AdminUserDetailDialogProps) {
  // Solo dispara fetch cuando hay id y el diálogo está abierto.
  const enabled = open && !!userId
  const { data, isLoading, isError, error } = useAdminUser(enabled ? userId : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="flex-1 overflow-y-auto scroll-thin">
          {isLoading ? (
            <DetailSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <p className="text-base font-semibold">Error al cargar el usuario</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {error instanceof ApiError ? error.message : "Intenta nuevamente."}
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-2"
              >
                Cerrar
              </Button>
            </div>
          ) : data ? (
            <DetailBody data={data} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Cuerpo del detalle
// ---------------------------------------------------------------------------

function DetailBody({ data }: { data: AdminUserDetail }) {
  const { user, batches } = data

  const totalPop = batches.reduce((s, b) => s + b.metrics.currentPopulation, 0)
  const totalExp = batches.reduce((s, b) => s + b.metrics.totalExpenses, 0)
  const totalInc = batches.reduce((s, b) => s + b.metrics.totalIncome, 0)
  const totalProfit = batches.reduce((s, b) => s + b.metrics.profit, 0)

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <DialogHeader className="gap-3 text-left">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-xl">{user.name}</DialogTitle>
            <DialogDescription className="truncate">{user.email}</DialogDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={user.role === "admin" ? "default" : "secondary"}
            className="gap-1"
          >
            <Shield className="size-3" />
            {user.role === "admin" ? "Admin" : "Usuario"}
          </Badge>
          <Badge
            variant="outline"
            className={
              user.disabled
                ? "border-transparent bg-destructive/10 text-destructive gap-1"
                : "border-transparent bg-primary/10 text-primary gap-1"
            }
          >
            {user.disabled ? (
              <>
                <PowerOff className="size-3" />
                Desactivado
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3" />
                Activo
              </>
            )}
          </Badge>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Registrado: {formatDate(user.createdAt)}
          </span>
        </div>
      </DialogHeader>

      {/* KPIs agregados */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <DetailKpi
          icon={<Bird className="size-4" />}
          label="Lotes"
          value={formatNumber(batches.length)}
        />
        <DetailKpi
          icon={<Users className="size-4" />}
          label="Pob. actual"
          value={formatNumber(totalPop)}
        />
        <DetailKpi
          icon={<Coins className="size-4" />}
          label="Gastos"
          value={formatMoney(totalExp)}
        />
        <DetailKpi
          icon={<TrendingUp className="size-4" />}
          label="Ingresos"
          value={formatMoney(totalInc)}
        />
        <DetailKpi
          icon={totalProfit >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          label="Utilidad"
          value={formatMoney(totalProfit)}
          tone={totalProfit >= 0 ? "primary" : "destructive"}
        />
      </div>

      {/* Lotes */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Lotes del usuario</h3>
        {batches.length === 0 ? (
          <Card className="border-dashed py-0">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bird className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                Este usuario aún no tiene lotes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col divide-y rounded-lg border bg-card">
            {batches.map(({ batch, metrics }: AdminBatchWithMetrics) => {
              const isActive = batch.status === "active"
              return (
                <div
                  key={batch.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium leading-tight">{batch.name}</p>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {isActive ? "Activo" : "Cerrado"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Día {metrics.daysOld}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatDateShort(batch.startDate)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
                    <Metric label="Ingresados" value={formatNumber(batch.initialCount)} />
                    <Metric label="Pob. actual" value={formatNumber(metrics.currentPopulation)} />
                    <Metric label="Mortalidad" value={formatPercent(metrics.mortalityRate)} />
                    <Metric
                      label="Utilidad"
                      value={formatMoney(metrics.profit)}
                      tone={metrics.profit >= 0 ? "primary" : "destructive"}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------

function DetailKpi({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode
  label: string
  value: string
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
      <CardContent className="flex flex-col gap-1.5 px-3 py-3">
        <span className={`flex size-7 items-center justify-center rounded-md ${toneClass}`}>
          {icon}
        </span>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "primary" | "destructive"
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={
          "font-medium tabular-nums " +
          (tone === "primary"
            ? "text-primary"
            : tone === "destructive"
              ? "text-destructive"
              : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}
