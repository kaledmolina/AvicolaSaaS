"use client"

import * as React from "react"
import { Bird, LogOut, ShieldCheck } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Barra superior fija con marca y menú de usuario. Visible solo cuando
 * el usuario está autenticado (la decide el AppShell).
 */
export function SiteHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user
  const role = (user as { role?: string } | undefined)?.role
  const isAdmin = role === "admin"

  const initials = React.useMemo(() => {
    const name = user?.name || user?.email || "U"
    const parts = name.split(/[\s@.]+/).filter(Boolean)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [user?.name, user?.email])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Ir al panel"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Bird className="size-5" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">
              Avícola<span className="text-primary">SaaS</span>
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              Gestión avícola
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              onClick={() => router.push("/?view=admin")}
              aria-label="Panel de administración"
            >
              <ShieldCheck className="size-4" />
              <span className="font-semibold">Admin</span>
            </Button>
          )}
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 pl-1.5 pr-2"
                  aria-label="Menú de usuario"
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">
                    {user.name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">
                    {user.name || "Usuario"}
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                  {isAdmin && (
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <ShieldCheck className="size-3" />
                      Administrador
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    router.push("/")
                  }}
                >
                  <Bird className="size-4" />
                  Mis lotes
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      router.push("/?view=admin")
                    }}
                  >
                    <ShieldCheck className="size-4 text-primary" />
                    Panel de administración
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault()
                    signOut({ callbackUrl: "/" })
                  }}
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
