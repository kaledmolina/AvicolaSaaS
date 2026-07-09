// Rate limiting en memoria por clave (IP o email).
// Simple y suficiente para un SaaS de un solo servidor. Para entornos
// multi-instancia se debería migrar a Redis, pero la interfaz se mantiene.

type Bucket = {
  count: number
  resetAt: number // epoch ms
}

const buckets = new Map<string, Bucket>()

// Limpieza periódica de buckets expirados (cada 5 min)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // epoch ms
}

/**
 * Comprueba si una clave puede realizar una acción. Limita a `max` intentos
 * por ventana de `windowMs` milisegundos.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  cleanup()
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  existing.count += 1
  const allowed = existing.count <= max
  return {
    allowed,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  }
}

// Extrae la IP del cliente de los headers habituales (detrás de proxy/gateway).
export function getClientIp(req: Request): string {
  const h = req.headers
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown"
  )
}
