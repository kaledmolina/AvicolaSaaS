# Task ID: 9 — Backup UI (AvícolaSaaS)

**Agent**: fullstack-developer (Backup UI)
**Fecha**: sesión actual
**Estado**: ✅ completado

## Scope
Implementar la UI de Copia de Seguridad / Restauración para el panel de super-admin. Español, tema naranja (primary). Conecta con el backend ya existente en `src/app/api/admin/backup/**`.

## Archivos
- **Creados**:
  - `src/hooks/use-backup.ts` — hooks TanStack Query: `useDownloadBackup()` (blob download) + `useRestoreBackup()` (multipart upload).
  - `src/components/admin/backup-section.tsx` — Card con dos sub-secciones (descargar / restaurar), AlertDialog de confirmación destructiva, Alert de éxito con botón "Recargar página".
- **Editados**:
  - `src/components/admin/admin-panel.tsx` — import + render `<BackupSection/>` después de la tabla de usuarios, antes del diálogo de detalle.

## Contrato API consumido
- `GET /api/admin/backup` → binario `.db`, `Content-Disposition: attachment; filename="backup-avicola-YYYYMMDDHHmmss.db"`. 401/403 si no admin.
- `POST /api/admin/backup/restore` → multipart/form-data con campo `file`. 200: `{success, message, size}`. Errores: 400 (no file / no SQLite / >50MB), 429 (rate-limit 1/2min), 401/403.

## Decisiones de implementación
- **Download via fetch + blob** (no `<a href>` directo) para poder leer el `Content-Disposition` y manejar errores JSON sin navegar la página. Cookies NextAuth viajan solas (same-origin).
- **Restore vía FormData** sin setear `Content-Type` (el navegador define el boundary multipart automáticamente).
- **AlertDialog con Button normal** (no `AlertDialogAction`) para mantener el diálogo abierto durante la petición y mostrar spinner en "Sí, restaurar".
- **Alert de éxito MUY visible** tras restore: borde `primary/40`, icono `RefreshCw` naranja, botón "Recargar página" (`window.location.reload()`). El restore cierra la conexión Prisma → reload obligatorio.
- Helper `readApiError()` reutilizable para ambos endpoints; captura errores de red (servidor caído tras restore) con mensaje que sugiere recargar.
- Tipos `TError: ApiError` en `useMutation` para type-safety en consumidores; fallback `instanceof ApiError ? ... : "..."` en toasts.

## Verificación
- `bun run lint` → exit 0 (sin warnings ni errores).
- Dev server recompiló limpio (`✓ Compiled in 194ms`).
- `GET / 200` en 487ms.
- No se tocaron otros archivos (solo los 3 listados arriba).

## Notas para futuros agentes
- Tras un restore exitoso, la app necesita un reload del navegador (la conexión Prisma se cerró en el backend). El UI lo comunica claramente con un botón prominente.
- `qk.adminUsers` se invalida tras restore, pero el refetch fallará hasta que la página se recargue (Prisma desconectado). Esto es esperado y el mensaje de éxito lo explica.
- Si se quiere añadir más adelante un listado de backups históricos, el contrato API actual no lo soporta (solo descarga la BD en vivo). Habría que extender el backend.
