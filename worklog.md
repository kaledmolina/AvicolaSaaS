# AvícolaSaaS — Worklog compartido

Proyecto: SaaS multi-usuario para gestión integral de granjas avícolas (pollos de engorde).
Stack: Next.js 16 (App Router) · TypeScript 5 · Tailwind CSS 4 · shadcn/ui (New York) · Prisma (SQLite) · NextAuth v4 (Credentials/JWT) · TanStack Query · recharts.

Ruta visible única: `/` (aplicación de una sola página con gestión de vistas en cliente).
API: bajo `/api/*` con aislamiento estricto por `userId` (sesión JWT).

---
Task ID: 1
Agent: main (arquitecto)
Task: Foundation — schema Prisma, tipos compartidos, auth (NextAuth + registro), providers, tema verde agrícola, utilidades de cliente.

Work Log:
- Definí `prisma/schema.prisma` con modelos User, Batch, Expense, Mortality, Weighing, Sale. Relaciones 1:N con `onDelete: Cascade` (User→Batch en el FK; Batch→hijos en el FK de cada hijo). Índices en `userId` y `batchId`.
- Ejecuté `bun run db:push` (tablas creadas + Prisma Client generado).
- Creé `src/lib/types.ts` con todas las entidades, DTOs de entrada, `BatchMetrics` y `BatchDetail` (contrato frontend↔backend).
- Creé `src/lib/password.ts` (hash/verify con scrypt nativo de Node, sin dependencias).
- Configuré NextAuth v4 en `src/lib/auth.ts` (CredentialsProvider, JWT, callbacks que adjuntan `userId` al token y sesión). Helper `getCurrentUser()` en `src/lib/session.ts`.
- Ruta `src/app/api/auth/[...nextauth]/route.ts` y `src/app/api/register/route.ts` (validación con zod, email normalizado, contraseña hasheada).
- Providers: `src/components/providers.tsx` (SessionProvider + QueryClientProvider + ThemeProvider next-themes) y `src/components/theme-provider.tsx`.
- Actualicé `src/app/layout.tsx` (lang="es", metadata, envoltura en Providers).
- Tema verde agrícola en `src/app/globals.css` (primary verde oklch(0.52 0.13 150), charts verde/ámbar/terracota, scrollbar custom `.scroll-thin`).
- Utilidades cliente: `src/lib/api.ts` (fetch con ApiError), `src/lib/format.ts` (COP, fechas es-CO/America/Bogota), `src/lib/queries.ts` (claves de query).

Stage Summary:
- Base lista para que subagents construyan API (Task 2) y frontend (Task 3) sobre el contrato de tipos.
- Moneda: COP. Zona horaria: America/Bogota. Idioma UI: español.
- Auth lista: registro vía POST /api/register, login vía NextAuth credentials. Sesión JWT con `session.user.id`.
- Pendiente: el frontend debe usar `useSession` (client) y el API `getCurrentUser()` (server) para el aislamiento.

---
Task ID: 2
Agent: full-stack-developer (API)
Task: Backend API routes — CRUD completo para Lotes (Batches) y sus recursos hijos (Expenses, Mortality, Weighings, Sales) con aislamiento estricto por usuario y cálculo de métricas.

Work Log:
- Leí `worklog.md` (Task 1) y los archivos base: `src/lib/types.ts`, `src/lib/session.ts`, `src/lib/auth.ts`, `prisma/schema.prisma`, `src/app/api/register/route.ts` para alinearme al contrato de tipos y a las convenciones de respuestas (zod + 400 con `error: <primer mensaje>`, 401 "No autenticado", 500 "Error interno del servidor").
- Creé `src/lib/metrics.ts` con `computeMetrics(batch, expenses, mortality, weighings, sales)` que recibe filas crudas de Prisma (Date objects) y devuelve un `BatchMetrics` exactamente con la forma de `src/lib/types.ts`. Calcula totalMortality, totalSold, currentPopulation, mortalityRate (%), totalExpenses (Σ quantity*unitPrice), totalIncome (Σ count*unitPrice), profit, conteos, lastWeighing (último por fecha desc) y daysOld (Math.floor((now - startDate)/86400000), floor en 0).
- Creé `src/app/api/batches/route.ts`:
  - GET → lista `db.batch.findMany({ where:{ userId }, orderBy:{ createdAt:"desc" }})`.
  - POST → zod valida `BatchInput` (name 1..120, initialCount int ≥1, startDate ISO válido, status enum opcional default "active", notes ≤1000 nullable opcional). Guarda `startDate: new Date(startDate)`, normaliza `notes` vacío a `null`. 201.
- Creé `src/app/api/batches/[id]/route.ts`:
  - GET → `findFirst({ id, userId })` (404 "Lote no encontrado" si no existe o es ajeno), luego `Promise.all` para cargar expenses/mortality/weighings/sales (todos `orderBy: { date: "desc" }`), `computeMetrics(...)`, retorna `BatchDetail { batch, metrics, expenses, mortality, weighings, sales }`.
  - PUT → zod `Partial<BatchInput>` (todos opcionales). Verifica propiedad, construye `update` solo con campos presentes, convierte `startDate` a Date, normaliza `notes`. 200.
  - DELETE → verifica propiedad, `db.batch.delete` (cascade elimina hijos), 204 con `new NextResponse(null, { status: 204 })`.
  - `params` se `await` (Next 16 Promise params).
- Creé 4 rutas batch-scoped (`src/app/api/batches/[id]/{expenses,mortality,weighings,sales}/route.ts`), cada una con GET (lista ordenada date desc) y POST (valida su DTO con zod, verifica propiedad del lote antes de crear, 201). Campos: expense (description 1..200, quantity>0, unitPrice≥0, date), mortality (date, count int≥1, cause ≤200 nullable), weighing (date, avgWeight>0), sale (date, count int≥1, unitPrice≥0). Strings vacíos de `cause` → null.
- Creé 4 rutas resource-scoped (`src/app/api/{expenses,mortality,weighings,sales}/[id]/route.ts`) con PUT y DELETE. Patrón de aislamiento: `findUnique({ where:{ id }, include:{ batch:{ select:{ userId:true }} }})` y verificar `resource.batch.userId === user.id`; si no coincide → 404 "Registro no encontrado" (nunca 403, no filtra existencia). DELETE → 204.
- Ejecuté `bun run lint` → sin errores ni warnings en mis archivos.
- Revisé `dev.log`: servidor en puerto 3000 sigue saludable, sin errores de compilación.

Stage Summary:
- Archivos creados (11):
  1. `src/lib/metrics.ts`
  2. `src/app/api/batches/route.ts`
  3. `src/app/api/batches/[id]/route.ts`
  4. `src/app/api/batches/[id]/expenses/route.ts`
  5. `src/app/api/batches/[id]/mortality/route.ts`
  6. `src/app/api/batches/[id]/weighings/route.ts`
  7. `src/app/api/batches/[id]/sales/route.ts`
  8. `src/app/api/expenses/[id]/route.ts`
  9. `src/app/api/mortality/[id]/route.ts`
  10. `src/app/api/weighings/[id]/route.ts`
  11. `src/app/api/sales/[id]/route.ts`
- Contrato API completo implementado: 5 recursos × (GET list, POST create, GET detail/PUT/DELETE) con métricas calculadas en `GET /api/batches/[id]`.
- Aislamiento de datos garantizado en TODOS los handlers: `getCurrentUser()` → 401; batch-scoped filtra por `userId`; resource-scoped verifica `batch.userId === user.id` y devuelve 404 (no 403) para datos ajenos.
- `params` siempre awaited (Next 16). `NextResponse.json` serializa Date → ISO string automáticamente, coincidiendo con los tipos `string` ISO del contrato.
- `bun run lint` pasa limpio. Listo para que el frontend (Task 3) consuma `/api/batches`, `/api/batches/[id]` (BatchDetail con metrics) y los endpoints de hijos.

---
Task ID: 3
Agent: full-stack-developer (Frontend)
Task: Frontend SPA completo (route `/`) para AvícolaSaaS — auth gate, dashboard de lotes, detalle de lote con KPIs dinámicos, tabs de gastos/mortalidad/pesajes/ventas, formularios CRUD con react-hook-form + zod, integración con TanStack Query sobre el contrato del Task 2.

Work Log:
- Leí `worklog.md`, `src/lib/{types,api,format,queries,utils}.ts`, providers, layout, globals.css y los primitives shadcn disponibles (button, card, dialog, dropdown-menu, select, table, tabs, alert-dialog, badge, input, label, textarea, skeleton, separator, avatar) para alinear el frontend con la base del Task 1.
- Creé `src/hooks/use-batches.ts` con hooks de TanStack Query para batches y todas las entidades hijas (CRUD + invalidación de `qk.batches` y `qk.batchDetail(batchId)`). Convención: el hook devuelve la mutación, el componente llama `mutateAsync` y muestra toasts en try/catch.
- `src/components/theme-toggle.tsx`: botón outline size-icon con `useTheme()` de next-themes, hidratación segura (mounted) y aria-label.
- `src/components/site-header.tsx`: barra superior sticky con blur, marca con icono `Bird`, ThemeToggle y DropdownMenu de usuario con iniciales + email + "Cerrar sesión" (`signOut({callbackUrl:"/"})`).
- `src/components/site-footer.tsx`: footer `border-t` con copyright y microcopy; queda fijado abajo por el `flex min-h-screen flex-col` del AppShell.
- `src/components/auth/auth-screen.tsx`: card centrada (max-w-md) sobre gradiente verde con blobs, brand con `Bird`, Tabs "Iniciar sesión | Crear cuenta". Login con `signIn("credentials", {redirect:false})` + toasts de error/éxito + `router.refresh()`. Registro con `api.post("/api/register", ...)` + auto `signIn` + `router.refresh()`. Esquemas zod inline (email, password min 6 para registro).
- `src/components/dashboard/batch-card.tsx`: Card clickeable (role=button, Enter/Space) que abre `/?batch=ID`; dropdown kebab con Editar / Cerrar-Reabrir (PUT status) / Eliminar (AlertDialog → DELETE → invalidate). status Badge activo/cerrado. Días calculados cliente-side desde `startDate`.
- `src/components/dashboard/batch-form-dialog.tsx`: Dialog create/edit con name, initialCount (coerce.int.min 1), startDate (date default today), status (Select active/closed), notes (Textarea opcional). Reset con `useEffect` al abrir/cambiar batch. PUT/POST según modo.
- `src/components/dashboard/dashboard.tsx`: heading + KPI tiles (total lotes, activos, cerrados, Σ initialCount — solo del listado, sin fetch de detalles), grid responsive `sm:grid-cols-2 lg:grid-cols-3`, skeletons al cargar, EmptyState con CTA, BatchCard con onEdit. Maneja isError con mensaje + reintentar.
- `src/components/batch/kpi-cards.tsx`: 6 tarjetas (Población actual, Mortalidad %, Gastos totales, Ingresos totales, Utilidad con color auto verde/rojo, Último peso) en grid `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`. Iconos en cuadro tintado (primary/muted/danger/success) según tono. Etiquetas uppercase muted, valor 2xl bold tabular-nums.
- `src/components/batch/forms/*`: 4 formularios (expense, mortality, weighing, sale) con zod + coerce.number, defaults saneados (date=today), reset al abrir, POST a `/api/batches/:id/<entity>` o PUT `/api/<entity>/:id`, invalidación de detail+batches, toasts en try/catch.
- `src/components/batch/tabs/expenses-tab.tsx`: header con título + count + botón "Añadir", Card con tabla envuelta en `max-h-[28rem] overflow-y-auto scroll-thin` (header sticky), columnas Fecha/Descripción/Cantidad/V.Unitario/Total/Acciones (lápiz + papelera), AlertDialog de confirmación, EmptyState dentro de la Card.
- `src/components/batch/tabs/mortality-tab.tsx`: misma estructura, columnas Fecha/Cantidad/Causa/Acciones; muestra "—" si no hay causa.
- `src/components/batch/tabs/weighings-tab.tsx`: incluye Card con `LineChart` de recharts (Curva de crecimiento) que ordena los pesajes por fecha asc, X = formatDateShort, Y = avgWeight (g); tooltip con estilo CSS vars del tema (verde primary). Hint muted si <2 puntos. Debajo, tabla Fecha/Peso promedio/Acciones.
- `src/components/batch/tabs/sales-tab.tsx`: tabla Fecha/Cantidad/P.Unitario/Ingreso (count*unitPrice)/Acciones.
- `src/components/batch/batch-detail.tsx`: back button (router.push("/")), header Card con nombre+status badge+ingresados+inicio+día+notes, acciones Editar/Cerrar-Reabrir/Eliminar (AlertDialog → DELETE → router.push("/")), `<KpiCards/>`, `<Tabs defaultValue="expenses">` con 4 triggers que incluyen count badges, TabsContent renderiza cada tab pasando `batchId` y los arrays del detail (sin fetches extra). Skeletons mientras carga; estado 404 con back button + mensaje.
- `src/components/app-shell.tsx`: `flex min-h-screen flex-col bg-background` → SiteHeader / main flex-1 / SiteFooter (mt-auto natural). Lee `useSearchParams().get("batch")` para encaminar Dashboard vs BatchDetail. Exporta `AppShellFallback` (spinner) para Suspense.
- `src/app/page.tsx`: `'use client'`, `useSession()`. loading → spinner full-screen con Loader2; unauthenticated → `<AuthScreen/>`; authenticated → `<Suspense fallback={<AppShellFallback/>}><AppShell/></Suspense>` (Suspense obligatorio por `useSearchParams`).

Stage Summary:
- 20 archivos creados exactamente bajo la estructura requerida (page.tsx, site-header, site-footer, theme-toggle, auth/auth-screen, app-shell, dashboard/{dashboard,batch-card,batch-form-dialog}, batch/{batch-detail,kpi-cards}, batch/tabs/{expenses,mortality,weighings,sales}-tab, batch/forms/{expense,mortality,weighing,sale}-form-dialog, hooks/use-batches).
- `bun run lint` pasa sin errores (exit 0). Dev server responde 200 en `/` sin errores de compilación.
- Sin imports desde `src/app/api/**` ni `src/lib/**` fuera de los exports permitidos (types, api, format, queries, utils). No se tocó prisma, .env, layout, globals.css, providers, theme-provider ni `src/components/ui/**`.
- UI 100% en español, moneda COP (sin decimales), fechas es-CO, tema verde agrícola (sin indigo/azul). Responsive mobile-first, targets ≥40px, focus rings, ARIA labels en iconos, sticky footer con `mt-auto`, skeletons/spinners en cargas, AlertDialog en todas las eliminaciones, toasts vía `useToast`.
- Recharts integrado con variables CSS del tema (stroke var(--primary)) para mantener la paleta verde; chart oculto con hint si <2 pesajes.
- Convención consistente: cada mutación invalida `qk.batches` + `qk.batchDetail(batchId)`; los componentes llamadores envuelven `mutateAsync` en try/catch y muestran toasts (`useToast`).

---
Task ID: 4
Agent: main (arquitecto) — integración y verificación
Task: Verificación end-to-end con Agent Browser, lint, responsividad, sticky footer y aislamiento de datos.

Work Log:
- Lanzados en paralelo dos subagents (Task 2 API, Task 3 Frontend) sobre el contrato de tipos compartido. Ambos reportaron lint limpio.
- Verificación con Agent Browser en http://localhost:3000/:
  - Pantalla de auth (login/register) renderiza con tema verde, toggle de tema.
  - Registro de usuario "Juan Granjero" + auto-login → dashboard con KPIs agregados y estado vacío.
  - Crear lote "Galpón A - Lote 5" (500 aves) → aparece en grid clickeable.
  - Detalle del lote: 6 tarjetas KPI dinámicas (Población, Mortalidad %, Gastos, Ingresos, Utilidad, Último peso) + header + 4 tabs.
  - CRUD completo por tab: Gasto (10×$45.000), Mortalidad (12 aves → 2,4%), 2 Pesajes (gráfico recharts de crecimiento), Venta (200×$18.000).
  - Cálculos en tiempo real verificados: Población 288 (500−12−200), Gastos $450.000, Ingresos $3.600.000, Utilidad $3.150.000, Último peso 180g.
  - Eliminación de gasto con diálogo de confirmación → KPIs vuelven a $0.
  - Logout → registro de segundo usuario "María" → dashboard VACÍO (0 lotes): aislamiento de datos confirmado.
  - Footer sticky: en página corta bottom=844=viewport (sin hueco); en página larga empujado naturalmente (sin superposición).
  - Viewport móvil 390×844 y desktop 1440×900 verificados.
- `bun run lint` → exit 0. dev.log sin errores/warnings de hidratación ni runtime.

Stage Summary:
- Aplicación SaaS completa y funcional en la ruta única `/`.
- Multi-usuario con aislamiento estricto (sesión JWT + filtro por userId en todo el API; recursos ajenos devuelven 404).
- Cero errores de consola, lint limpio, footer sticky, responsive.
- Entregables del usuario cubiertos: (1) arquitectura + stack, (2) schema.prisma con cascade, (3) interfaces TS en src/lib/types.ts, (4) vista Detalle del Lote con cálculos dinámicos — además de la app completa y verificada.
