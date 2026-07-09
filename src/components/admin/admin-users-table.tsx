"use client"

// =============================================================================
// Tabla de usuarios para el Panel de Super-Admin (AvícolaSaaS).
// Lista AdminUserSummary[] en una <Table> con scroll horizontal en móvil y
// scroll vertical en tbody. Acciones: ver detalle, activar/desactivar,
// hacer/quitar admin (con confirmación para acciones destructivas).
// =============================================================================

import * as React from "react"
import {
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Shield,
  ShieldOff,
  UserCog,
  Eye,
  Power,
  PowerOff,
} from "lucide-react"

import { ApiError } from "@/lib/api"
import {
  formatDateShort,
  formatMoney,
  formatNumber,
} from "@/lib/format"
import type { AdminUserSummary, UserRole } from "@/lib/types"
import {
  useSetUserRole,
  useToggleUserDisabled,
} from "@/hooks/use-admin"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface AdminUsersTableProps {
  users: AdminUserSummary[]
  currentUserId: string
  onViewDetails: (userId: string) => void
}

type PendingAction =
  | { type: "disable"; user: AdminUserSummary }
  | { type: "demote"; user: AdminUserSummary }
  | null

export function AdminUsersTable({
  users,
  currentUserId,
  onViewDetails,
}: AdminUsersTableProps) {
  const { toast } = useToast()
  const toggleDisabled = useToggleUserDisabled()
  const setRole = useSetUserRole()
  const [pending, setPending] = React.useState<PendingAction>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  async function handleToggleDisabled(user: AdminUserSummary) {
    setBusyId(user.id)
    try {
      await toggleDisabled.mutateAsync({
        id: user.id,
        disabled: !user.disabled,
      })
      toast({
        title: user.disabled ? "Usuario activado" : "Usuario desactivado",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof ApiError ? err.message : "No se pudo actualizar.",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
      setPending(null)
    }
  }

  async function handleSetRole(user: AdminUserSummary, role: UserRole) {
    setBusyId(user.id)
    try {
      await setRole.mutateAsync({ id: user.id, role })
      toast({
        title:
          role === "admin"
            ? "Usuario promovido a administrador"
            : "Rol actualizado a usuario",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof ApiError ? err.message : "No se pudo actualizar.",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
      setPending(null)
    }
  }

  return (
    <Card className="py-0">
      <CardContent className="px-0 py-0">
        <div className="scroll-thin max-h-[32rem] overflow-y-auto">
          <Table className="w-full min-w-[920px]">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 sm:pl-6">Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Lotes</TableHead>
                <TableHead className="text-right">Pob. actual</TableHead>
                <TableHead className="text-right">Gastos</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead className="pr-4 text-right sm:pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUserId
                  const isBusy = busyId === u.id
                  const disableSelfHint = isSelf && !u.disabled
                  const demoteSelfHint = isSelf && u.role === "admin"
                  return (
                    <TableRow
                      key={u.id}
                      className={u.disabled ? "opacity-60" : undefined}
                    >
                      {/* Usuario */}
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-tight">
                              {u.name}
                              {isSelf && (
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                  (tú)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Rol */}
                      <TableCell>
                        <Badge
                          variant={u.role === "admin" ? "default" : "secondary"}
                          className={u.role === "admin" ? "gap-1" : undefined}
                        >
                          {u.role === "admin" ? (
                            <>
                              <Shield className="size-3" />
                              Admin
                            </>
                          ) : (
                            "Usuario"
                          )}
                        </Badge>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.disabled
                              ? "border-transparent bg-destructive/10 text-destructive gap-1"
                              : "border-transparent bg-primary/10 text-primary gap-1"
                          }
                        >
                          {u.disabled ? (
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
                      </TableCell>

                      {/* Lotes */}
                      <TableCell className="text-right tabular-nums">{u.batchCount}</TableCell>

                      {/* Pob. actual */}
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(u.currentPopulation)}
                      </TableCell>

                      {/* Gastos */}
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(u.totalExpenses)}
                      </TableCell>

                      {/* Ingresos */}
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(u.totalIncome)}
                      </TableCell>

                      {/* Utilidad */}
                      <TableCell
                        className={
                          "text-right tabular-nums font-medium " +
                          (u.profit >= 0 ? "text-primary" : "text-destructive")
                        }
                      >
                        {formatMoney(u.profit)}
                      </TableCell>

                      {/* Registrado */}
                      <TableCell className="text-muted-foreground">
                        {formatDateShort(u.createdAt)}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="pr-4 text-right sm:pr-6">
                        <div className="flex items-center justify-end">
                          {isBusy && (
                            <Loader2 className="mr-2 size-4 animate-spin text-muted-foreground" />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Acciones para ${u.name}`}
                                disabled={isBusy}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="truncate">{u.email}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => onViewDetails(u.id)}>
                                <Eye className="size-4" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  if (u.disabled) {
                                    void handleToggleDisabled(u)
                                  } else {
                                    setPending({ type: "disable", user: u })
                                  }
                                }}
                                disabled={disableSelfHint}
                                variant={u.disabled ? "default" : "destructive"}
                                title={
                                  disableSelfHint
                                    ? "No puedes desactivar tu propia cuenta"
                                    : undefined
                                }
                              >
                                <Power className="size-4" />
                                {u.disabled ? "Activar" : "Desactivar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  if (u.role === "admin") {
                                    setPending({ type: "demote", user: u })
                                  } else {
                                    void handleSetRole(u, "admin")
                                  }
                                }}
                                disabled={demoteSelfHint}
                                variant={u.role === "admin" ? "destructive" : "default"}
                                title={
                                  demoteSelfHint
                                    ? "No puedes quitarte tus propios permisos de admin"
                                    : undefined
                                }
                              >
                                {u.role === "admin" ? (
                                  <>
                                    <ShieldOff className="size-4" />
                                    Quitar admin
                                  </>
                                ) : (
                                  <>
                                    <UserCog className="size-4" />
                                    Hacer admin
                                  </>
                                )}
                              </DropdownMenuItem>
                              {demoteSelfHint && (
                                <p className="px-2 pb-1 pt-0.5 text-[11px] text-muted-foreground">
                                  No puedes quitarte tus propios permisos.
                                </p>
                              )}
                              {disableSelfHint && (
                                <p className="px-2 pb-1 pt-0.5 text-[11px] text-muted-foreground">
                                  No puedes desactivar tu propia cuenta.
                                </p>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Confirm dialog for destructive actions */}
      <AlertDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.type === "disable"
                ? "¿Desactivar usuario?"
                : "¿Quitar permisos de admin?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <span>
                {pending?.type === "disable" ? (
                  <>
                    Vas a desactivar a <strong>{pending?.user.name}</strong> ({pending?.user.email}).
                    Este usuario no podrá iniciar sesión hasta que lo reactives.
                  </>
                ) : (
                  <>
                    Vas a quitar los permisos de administrador a{" "}
                    <strong>{pending?.user.name}</strong> ({pending?.user.email}). Solo podrá
                    gestionar sus propios lotes.
                  </>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={busyId !== null}
              onClick={() => {
                if (!pending) return
                if (pending.type === "disable") {
                  void handleToggleDisabled(pending.user)
                } else {
                  void handleSetRole(pending.user, "user")
                }
              }}
            >
              {busyId !== null && <Loader2 className="size-4 animate-spin" />}
              {pending?.type === "disable" ? "Desactivar" : "Quitar admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
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
