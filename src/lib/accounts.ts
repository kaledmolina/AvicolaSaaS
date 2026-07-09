// Credenciales de las cuentas especiales del sistema.
// El usuario demo permite probar el sistema sin registrarse.
// El admin accede al panel de super-administración.

export const DEMO_EMAIL = "demo@avicola.test"
export const DEMO_PASSWORD = "demo123456"

export const ADMIN_EMAIL = "admin@avicola.test"
export const ADMIN_PASSWORD = "admin123456"

export function isDemoEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL
}
