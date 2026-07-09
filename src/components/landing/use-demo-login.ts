"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/accounts"
import { useToast } from "@/hooks/use-toast"

/**
 * Hook compartido para el botón "Probar demo" del landing.
 * Inicia sesión con las credenciales demo (definidas en @/lib/accounts),
 * muestra un estado de carga y, en caso de éxito, refresca la página para
 * que el agente principal re-renderice a la app autenticada.
 */
export function useDemoLogin() {
  const router = useRouter()
  const { toast } = useToast()
  const [demoLoading, setDemoLoading] = React.useState(false)

  async function handleDemo() {
    setDemoLoading(true)
    const res = await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirect: false,
    })
    setDemoLoading(false)
    if (res?.error) {
      toast({
        title: "No se pudo iniciar el demo",
        description: "Intenta de nuevo más tarde",
        variant: "destructive",
      })
    } else {
      router.refresh()
    }
  }

  return { demoLoading, handleDemo }
}
