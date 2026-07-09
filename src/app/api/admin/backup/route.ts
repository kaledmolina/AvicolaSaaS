import { NextResponse } from "next/server"
import { readFile, writeFile, access, stat } from "fs/promises"
import path from "path"
import { requireAdmin } from "@/lib/session"

// La BD SQLite es un único archivo en disco. Hacemos copia de seguridad
// leyendo ese archivo y enviándolo como descarga. No bloqueamos la BD
// formalmente (SQLite permite leer el archivo en caliente para backup).

// Resuelve la ruta real del archivo .db desde DATABASE_URL.
// DATABASE_URL = "file:/home/z/my-project/db/custom.db"
function dbPath(): string {
  const url = process.env.DATABASE_URL || ""
  const p = url.replace(/^file:/, "")
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
}

// GET /api/admin/backup → descarga el archivo .db actual.
export async function GET() {
  const guard = await requireAdmin()
  if ("response" in guard) return guard.response

  try {
    const file = dbPath()
    try {
      await access(file)
    } catch {
      return NextResponse.json(
        { error: "No se encontró el archivo de la base de datos" },
        { status: 500 }
      )
    }

    const buffer = await readFile(file)
    const st = await stat(file)
    // Nombre con timestamp: backup-YYYYMMDD-HHmmss.db
    const ts = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14)
    const filename = `backup-avicola-${ts}.db`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(st.size),
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("GET /api/admin/backup", err)
    return NextResponse.json(
      { error: "Error al generar la copia de seguridad" },
      { status: 500 }
    )
  }
}
