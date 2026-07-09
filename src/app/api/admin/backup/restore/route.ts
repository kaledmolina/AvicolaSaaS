import { NextResponse } from "next/server"
import path from "path"
import { writeFile, access } from "fs/promises"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { rateLimit } from "@/lib/rate-limit"

// Restaura la BD desde un archivo .db subido por el admin.
// Proceso:
//  1. Validar admin.
//  2. Rate limit (1 restauración cada 2 min para evitar abusos).
//  3. Leer el archivo subido (máx 50 MB).
//  4. Validar que sea un SQLite válido (magic header "SQLite format 3\0").
//  5. Cerrar la conexión Prisma actual.
//  6. Sobrescribir el archivo .db.
//  7. Pedir al admin que reinicie el servidor (la reconexión se hace al arranque).

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB
const SQLITE_MAGIC = "SQLite format 3"

function dbPath(): string {
  const url = process.env.DATABASE_URL || ""
  const p = url.replace(/^file:/, "")
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if ("response" in guard) return guard.response

  // Rate limit: 1 restauración cada 2 minutos.
  const rl = rateLimit("restore:admin", 1, 2 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Espera unos minutos antes de restaurar nuevamente." },
      { status: 429 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes seleccionar un archivo .db" },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "El archivo está vacío" },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el límite de 50 MB" },
        { status: 400 }
      )
    }

    const bytes = new Uint8Array(await file.arrayBuffer())

    // Validar magic header de SQLite.
    const header = Buffer.from(bytes.slice(0, 16)).toString("latin1")
    if (!header.startsWith(SQLITE_MAGIC)) {
      return NextResponse.json(
        { error: "El archivo no es una base de datos SQLite válida" },
        { status: 400 }
      )
    }

    const target = dbPath()
    try {
      await access(target)
    } catch {
      return NextResponse.json(
        { error: "No se encontró el archivo de destino de la BD" },
        { status: 500 }
      )
    }

    // Cerrar la conexión Prisma antes de sobrescribir el archivo.
    await db.$disconnect()

    // Sobrescribir el archivo .db con el contenido subido.
    await writeFile(target, bytes)

    return NextResponse.json({
      success: true,
      message:
        "Base de datos restaurada. La aplicación se reiniciará para aplicar los cambios.",
      size: bytes.length,
    })
  } catch (err) {
    console.error("POST /api/admin/backup/restore", err)
    // Reconectar por si falló tras disconnect.
    try {
      await db.$connect()
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: "Error al restaurar la base de datos" },
      { status: 500 }
    )
  }
}
