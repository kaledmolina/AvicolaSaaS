"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Bird, Loader2, LockKeyhole, Mail, Play, User as UserIcon } from "lucide-react"

import { ApiError, api } from "@/lib/api"
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/accounts"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"

// ---------------------------------------------------------------------------
// Esquemas zod
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
})
type LoginValues = z.infer<typeof loginSchema>

const registerSchema = z.object({
  name: z.string().min(2, "Tu nombre es muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})
type RegisterValues = z.infer<typeof registerSchema>

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function AuthScreen() {
  const { toast } = useToast()
  const router = useRouter()
  const [demoLoading, setDemoLoading] = React.useState(false)

  async function onDemo() {
    setDemoLoading(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })
      if (!res || res.error) {
        toast({
          title: "Demo no disponible",
          description: "Intenta de nuevo más tarde.",
          variant: "destructive",
        })
        return
      }
      router.refresh()
    } finally {
      setDemoLoading(false)
    }
  }

  // ---- Login ----
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const [loginLoading, setLoginLoading] = React.useState(false)

  async function onLogin(values: LoginValues) {
    setLoginLoading(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      })
      if (!res || res.error) {
        toast({
          title: "Error de acceso",
          description: "Email o contraseña incorrectos",
          variant: "destructive",
        })
        return
      }
      toast({ title: "Bienvenido", description: "Sesión iniciada" })
      router.refresh()
    } catch {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoginLoading(false)
    }
  }

  // ---- Registro ----
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })
  const [registerLoading, setRegisterLoading] = React.useState(false)

  async function onRegister(values: RegisterValues) {
    setRegisterLoading(true)
    try {
      await api.post("/api/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      })
      toast({
        title: "Cuenta creada",
        description: "Iniciando sesión…",
      })
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      })
      if (!res || res.error) {
        toast({
          title: "Cuenta creada",
          description: "Inicia sesión para continuar.",
        })
        return
      }
      router.refresh()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo crear la cuenta."
      toast({
        title: "Error al registrar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 px-4 py-10">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-accent/40 blur-3xl" />

      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-muted-foreground"
        >
          Volver al inicio
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        {/* Marca */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Bird className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Avícola<span className="text-primary">SaaS</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestión integral de tu granja avícola
            </p>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="pb-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="register">Crear cuenta</TabsTrigger>
              </TabsList>

              {/* LOGIN */}
              <TabsContent value="login" className="mt-6">
                <CardHeader className="px-0">
                  <CardTitle className="text-xl">Bienvenido de nuevo</CardTitle>
                  <CardDescription>
                    Ingresa tus credenciales para acceder a tu panel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <form
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="grid gap-4"
                    noValidate
                  >
                    <Field
                      id="email"
                      label="Correo electrónico"
                      icon={<Mail className="size-4" />}
                      error={loginForm.formState.errors.email?.message}
                    >
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="tucorreo@granja.com"
                        aria-invalid={!!loginForm.formState.errors.email}
                        {...loginForm.register("email")}
                      />
                    </Field>

                    <Field
                      id="password"
                      label="Contraseña"
                      icon={<LockKeyhole className="size-4" />}
                      error={loginForm.formState.errors.password?.message}
                    >
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        aria-invalid={!!loginForm.formState.errors.password}
                        {...loginForm.register("password")}
                      />
                    </Field>

                    <Button
                      type="submit"
                      className="mt-2 h-10 w-full"
                      disabled={loginLoading}
                    >
                      {loginLoading && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {loginLoading ? "Ingresando…" : "Iniciar sesión"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              {/* REGISTRO */}
              <TabsContent value="register" className="mt-6">
                <CardHeader className="px-0">
                  <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
                  <CardDescription>
                    Empieza a gestionar tus lotes en minutos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <form
                    onSubmit={registerForm.handleSubmit(onRegister)}
                    className="grid gap-4"
                    noValidate
                  >
                    <Field
                      id="name"
                      label="Nombre"
                      icon={<UserIcon className="size-4" />}
                      error={registerForm.formState.errors.name?.message}
                    >
                      <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Tu nombre o el de tu granja"
                        aria-invalid={!!registerForm.formState.errors.name}
                        {...registerForm.register("name")}
                      />
                    </Field>

                    <Field
                      id="reg-email"
                      label="Correo electrónico"
                      icon={<Mail className="size-4" />}
                      error={registerForm.formState.errors.email?.message}
                    >
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="tucorreo@granja.com"
                        aria-invalid={!!registerForm.formState.errors.email}
                        {...registerForm.register("email")}
                      />
                    </Field>

                    <Field
                      id="reg-password"
                      label="Contraseña"
                      icon={<LockKeyhole className="size-4" />}
                      error={registerForm.formState.errors.password?.message}
                    >
                      <Input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        aria-invalid={!!registerForm.formState.errors.password}
                        {...registerForm.register("password")}
                      />
                    </Field>

                    <Button
                      type="submit"
                      className="mt-2 h-10 w-full"
                      disabled={registerLoading}
                    >
                      {registerLoading && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {registerLoading ? "Creando…" : "Crear cuenta"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">
                o
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-2"
            onClick={onDemo}
            disabled={demoLoading}
          >
            {demoLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4 text-primary" />
            )}
            {demoLoading ? "Entrando…" : "Probar como demo"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo: <span className="font-medium">{DEMO_EMAIL}</span> / {DEMO_PASSWORD}
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Tus datos se guardan de forma segura. COP · Colombia · Pollos de
          engorde.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field wrapper con icono
// ---------------------------------------------------------------------------

function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string
  label: string
  icon?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
