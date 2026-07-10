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

---
Task ID: 5-foundation
Agent: main (arquitecto) — fase 2
Task: Super-admin, paleta naranja, usuario demo y base para landing.

Work Log:
- Schema: añadí `role String @default("user")` y `disabled Boolean @default(false)` a User. db:push OK.
- Tipos (src/lib/types.ts): UserRole, campos role/disabled en User, y tipos admin: AdminUserSummary, AdminUserDetail, AdminBatchWithMetrics, AdminUserUpdate.
- Cuentas especiales (src/lib/accounts.ts): DEMO_EMAIL/PASSWORD, ADMIN_EMAIL/PASSWORD, isDemoEmail().
- Datos demo (src/lib/demo-data.ts): resetDemoData(userId) recrea 2 lotes (1 activo, 1 cerrado) con gastos/mortalidad/pesajes/ventas realistas. Se invoca en cada login demo.
- Seed (prisma/seed.ts): upsert admin (admin@avicola.test/admin123456, role admin) + demo (demo@avicola.test/demo123456) con datos. Ejecutado OK.
- Auth (src/lib/auth.ts): authorize rechaza disabled; si es demo → resetDemoData; JWT/session ahora incluyen `role`.
- Session (src/lib/session.ts): getCurrentUser() devuelve role; requireAdmin() helper (401/403).
- API admin: GET /api/admin/users (lista + stats agregadas), GET /api/admin/users/[id] (detalle + lotes + metrics), PATCH (toggle disabled/role). Protecciones: no auto-desactivarse; demo no se puede bloquear (se reactiva solo). Guard 401/403 verificado con curl.
- Paleta NARANJA en globals.css (hue ~50-55 oklch). Primary oklch(0.64 0.18 48), charts naranja/ámbar/terracota. Light + dark.
- qk.adminUsers / qk.adminUser añadidos.

Stage Summary:
- Listo para subagents: Landing page (Task 3) y Admin panel UI (Task 4).
- Contrato admin API: GET /api/admin/users → AdminUserSummary[]; GET /api/admin/users/:id → AdminUserDetail; PATCH /api/admin/users/:id {disabled?,role?}.
- Credenciales: admin@avicola.test/admin123456 · demo@avicola.test/demo123456.
- page.tsx y app-shell.tsx aún NO modificados (los hará el main tras los subagents): routing será landing por defecto (no-auth), ?auth=1 → AuthScreen, ?view=admin → AdminPanel (solo admin).

---
Task ID: 3 (landing)
Agent: frontend-styling-expert
Task: Landing page pública de AvícolaSaaS (español, tema naranja) — header sticky, hero con preview de producto, features, manual de uso, CTA final y footer. Lista para que el main la monte en `/` para usuarios no autenticados.

Work Log:
- Leí `worklog.md` (Tasks 1, 2, 3, 4, 5-foundation) para entender el estado: auth listo, API listo, SPA frontend listo, tema NARANJA aplicado en globals.css (primary oklch(0.64 0.18 48)), cuentas demo/admin definidas en `@/lib/accounts`, datos demo que resetean en cada login. Confirmé que NO debía tocar `page.tsx`, `app-shell`, `site-header/footer`, `auth/**`, `admin/**`, `ui/**`, `lib/**`, `globals.css`, `layout.tsx`, `hooks/**`, ni la API.
- Revisé `theme-toggle.tsx` (botón outline size-icon con `useTheme`, hidratación segura), `accounts.ts` (DEMO_EMAIL/PASSWORD), `button.tsx`/`card.tsx`/`badge.tsx` (variantes), `use-toast.ts` (API de `toast()`), `weighings-tab.tsx` (patrón recharts con `var(--primary)` stroke y estilos CSS vars), `globals.css` (paleta naranja + `tw-animate-css` importado) y `demo-data.ts` (lote demo "Galpón A — Lote 12", 1000 aves, curva de crecimiento 95→1980g). Verifiqué recharts v2.15 y framer-motion disponibles (opté por CSS/tw-animate para animaciones, sin framer-motion para SSR ligero).
- Creé `src/components/landing/use-demo-login.ts`: hook compartido `useDemoLogin()` que devuelve `{ demoLoading, handleDemo }`. Sigue EXACTAMENTE el patrón del spec: `setDemoLoading(true)` → `signIn("credentials", { email: DEMO_EMAIL, password: DEMO_PASSWORD, redirect: false })` → `setDemoLoading(false)` → si `res?.error` toast destructive ("No se pudo iniciar el demo") → si no `router.refresh()`. Reutilizado por hero y CTA.
- `landing-header.tsx`: `<header>` sticky top-0 z-40 con `border-b bg-background/80 backdrop-blur`. Marca = cuadrado naranja redondeado (`bg-primary text-primary-foreground`) con icono `Bird` + wordmark "Avícola" (foreground) + "SaaS" (`text-primary`). Derecha: `ThemeToggle` + `Button variant=ghost` "Iniciar sesión" → `router.push("/?auth=1")`. Altura h-16, max-w-7xl, responsive.
- `landing-hero.tsx`: `section` con fondo sutil (radial gradient naranja opacity 0.08 + gradient lineal from-primary/5). Grid `lg:grid-cols-2 gap-12 items-center`. Columna izquierda: `Badge` naranja tintado ("Gestión avícola integral · Multi-usuario" con `Sparkles`), H1 `text-4xl sm:text-5xl font-bold tracking-tight` con "de principio a fin" en `text-primary`, párrafo muted-foreground text-lg, fila de 2 CTAs (`Button size=lg` "Probar demo" con `Play`/`Loader2 animate-spin` "Entrando…" + `Button size=lg variant=outline` "Crear cuenta gratis" con `ArrowRight`), microcopy con credenciales demo. Columna derecha: Card preview de producto con `shadow-xl rotate-[-1deg] hover:rotate-0 transition`, header "Galpón A — Lote 12" + Badge "Activo", 3 mini KPI tiles (Población 488, Utilidad $3.150.000, Mortalidad 2,4% — COP y coma decimal es-CO), y `AreaChart` de recharts con gradient naranja `var(--primary)` (curva de crecimiento Día 7→42: 95→1980g). Blur decorativo `bg-primary/10` detrás.
- `landing-features.tsx`: sección con eyebrow `text-primary uppercase` "Funciones", H2 + subtítulo muted. Grid `sm:grid-cols-2 lg:grid-cols-3 gap-5` con 6 Cards: Lotes (Bird), Control de gastos (ReceiptText), Mortalidad diaria (Activity), Pesajes y crecimiento (Scale), Ventas e ingresos (CircleDollarSign), Rentabilidad en tiempo real (Calculator). Cada card: icono en tile `bg-primary/10 text-primary rounded-lg size-10`, título font-semibold, descripción muted-foreground text-sm. Hover: `hover:-translate-y-0.5 hover:shadow-md transition`.
- `landing-manual.tsx`: sección `border-t bg-muted/30` con eyebrow "Manual de uso", H2 "Cómo empezar en 5 pasos", subtítulo. Lista vertical de 5 Cards (max-w-3xl), cada una con número en círculo naranja (`bg-primary text-primary-foreground rounded-full size-9 font-bold`) + título con icono lucide (UserPlus, Bird, ClipboardList, BarChart3, TrendingUp) + descripción. Debajo, Card "Consejos" (`bg-accent/50 border-primary/20`) con 4 bullets en grid sm:grid-cols-2, cada bullet con punto naranja. Copy en español claro y accionable.
- `landing-cta.tsx`: banda final `rounded-3xl bg-primary text-primary-foreground` con decoración radial. H2 blanco "Empieza a gestionar tu granja hoy", subtítulo `text-primary-foreground/80`, 2 botones: "Probar demo" (`variant=secondary`, mismo hook con loading) + "Crear cuenta" (`variant=outline` override blanco transparente → `/?auth=1`).
- `landing-footer.tsx`: `footer border-t` con marca + "AvícolaSaaS © {year}" + microcopy "Hecho para productores de pollos de engorde" + nav de anclas (#funciones, #manual, #empezar). Responsive (flex-col en móvil, row en sm+).
- `landing-page.tsx`: composición `<div className="flex min-h-screen flex-col bg-background">` → LandingHeader → `<main className="flex-1">` (Hero, Features, Manual, Cta) → LandingFooter. Export nombrado `LandingPage` + default export. `'use client'` por los hooks de navegación/auth.
- Verificación: `bun run lint` → exit 0 (sin errores ni warnings). `bunx tsc --noEmit` → 0 errores en mis archivos (los errores TS preexistentes en form dialogs/admin API/examples/skills son ajenos a esta tarea y no toqué esos archivos). dev.log muestra servidor en puerto 3000 saludable (200 en `/`), sin tocar page.tsx.
- Accesibilidad: semántica `header`/`main`/`section`/`footer`, `aria-labelledby` en secciones, `aria-label` en marca y demo button implícito por texto, `aria-hidden` en decoración, focus-visible rings en links, alt implícito por iconos decorativos.

Stage Summary:
- 8 archivos creados bajo `src/components/landing/`:
  1. `use-demo-login.ts` (hook compartido)
  2. `landing-page.tsx` (composición + default export)
  3. `landing-header.tsx`
  4. `landing-hero.tsx` (con AreaChart recharts naranja)
  5. `landing-features.tsx`
  6. `landing-manual.tsx`
  7. `landing-cta.tsx`
  8. `landing-footer.tsx`
- Integración esperada por el main agent: en `src/app/page.tsx`, cuando `session.status === "unauthenticated"` renderizar `<LandingPage/>` por defecto; si `searchParams.get("auth") === "1"` renderizar `<AuthScreen/>`. El botón "Iniciar sesión"/"Crear cuenta" del landing → `router.push("/?auth=1")`; "Probar demo" → `useDemoLogin().handleDemo()` → `router.refresh()` re-renderiza a app autenticada.
- Tema NARANJA consistente (`bg-primary`, `text-primary`, `bg-primary/10`, `var(--primary)` en recharts). Cero azul/índigo/verde como primario. UI 100% español, COP (`$3.150.000`), decimal es-CO (`2,4%`). Responsive mobile-first. `bun run lint` limpio.

---
Task ID: 4
Agent: fullstack-developer (Admin UI)
Task: Super-Admin Panel UI — tabla de usuarios con KPIs, diálogo de detalle por usuario y mutaciones PATCH (toggle disabled / set role). Tema naranja, español, COP.

Work Log:
- Leí `worklog.md` (Tasks 1, 2, 3, 5-foundation) para alinearme al contrato admin API y a las convenciones del frontend (TanStack Query + toast en try/catch + invalidación de `qk.adminUsers` / `qk.adminUser(id)`).
- Revisé `src/lib/types.ts` (`AdminUserSummary`, `AdminUserDetail`, `AdminBatchWithMetrics`, `UserRole`, `BatchMetrics`, `Batch`), `src/lib/api.ts` (helper sin método PATCH → se usa `fetch` directo), `src/lib/format.ts`, `src/lib/queries.ts` (`qk.adminUsers`, `qk.adminUser(id)`), `src/hooks/use-batches.ts` (patrón de hooks a imitar) y los primitives shadcn disponibles (table, dialog, dropdown-menu, alert-dialog, badge, avatar, card, tooltip).
- Creé `src/hooks/use-admin.ts`:
  - `useAdminUsers()` → `useQuery({ queryKey: qk.adminUsers, queryFn: () => api.get<AdminUserSummary[]>("/api/admin/users") })`.
  - `useAdminUser(id)` → `useQuery({ queryKey: qk.adminUser(id), queryFn: () => api.get<AdminUserDetail>(\`/api/admin/users/${id}\`), enabled: !!id })`.
  - `patchUser(id, body)` helper interno: `fetch(\`/api/admin/users/${id}\`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) })` con manejo de errores que reutiliza `ApiError` (401 → "Debes iniciar sesión para continuar", otros → mensaje del body).
  - `useToggleUserDisabled()` → `useMutation({ mutationFn: ({id,disabled}) => patchUser(id,{disabled}), onSuccess: (data) => { qc.invalidateQueries({queryKey:qk.adminUsers}); qc.invalidateQueries({queryKey:qk.adminUser(data.id)}) } })`.
  - `useSetUserRole()` → mismo patrón con `{ role }`. Ambos exponen `mutateAsync`.
- Creé `src/components/admin/admin-users-table.tsx`:
  - `Card` con `Table` (min-w-[920px]) envuelta en `scroll-thin max-h-[32rem] overflow-y-auto` para scroll vertical; header sticky (`sticky top-0 z-10 bg-card`); scroll horizontal automático por el wrapper de shadcn Table.
  - Columnas: Usuario (avatar con iniciales en `bg-primary/10 text-primary` + nombre + email + "(tú)"), Rol (Badge default "Admin" con icono Shield / secondary "Usuario"), Estado (Badge outline con `bg-primary/10 text-primary` "Activo" / `bg-destructive/10 text-destructive` "Desactivado"; filas desactivadas con `opacity-60`), Lotes, Pob. actual (`formatNumber`), Gastos (`formatMoney`), Ingresos (`formatMoney`), Utilidad (`formatMoney`, `text-primary` si ≥0 / `text-destructive` si <0), Registrado (`formatDateShort`), Acciones (DropdownMenu kebab).
  - DropdownMenu: label con email, "Ver detalle" (llama `onViewDetails(id)`), separador, "Activar"/"Desactivar" (variant destructive si va a desactivar) y "Hacer admin"/"Quitar admin" (variant destructive si va a degradar). Deshabilita self-disable (`isSelf && !u.disabled`) y self-demote (`isSelf && u.role === "admin"`) con nota visible debajo del ítem.
  - `AlertDialog` global para confirmar acciones destructivas (disable / demote) con mensaje contextual y botón `bg-destructive`. Spinner `Loader2` en botones mientras `busyId !== null`.
  - Toasts en try/catch: éxito "Usuario desactivado" / "Usuario activado" / "Usuario promovido a administrador" / "Rol actualizado a usuario"; error muestra `err.message` (ApiError) en variant destructive.
- Creé `src/components/admin/admin-user-detail-dialog.tsx`:
  - `Dialog` large (`sm:max-w-3xl`) con `flex max-h-[90vh] flex-col` y cuerpo scrollable. Props: `{ userId, open, onOpenChange }`.
  - `useAdminUser(userId)` habilitado solo cuando `open && !!userId`. Skeletons en carga, mensaje + botón Cerrar en error.
  - Header: avatar grande con iniciales, nombre (DialogTitle), email (DialogDescription), badge de rol (Shield + Admin/Usuario), badge de estado (CheckCircle2/PowerOff), fecha de registro.
  - KPI grid (5 tiles en `sm:grid-cols-5`): # Lotes, Pob. actual total (Σ currentPopulation), Gastos totales, Ingresos totales, Utilidad total (text-primary/destructive según signo).
  - Lista de lotes con `divide-y` border: nombre + status badge + "Día {daysOld}" + fecha inicio + Ingresados + Pob. actual + Mortalidad % + Utilidad (con color). Empty state "Este usuario aún no tiene lotes." si no hay batches.
- Creé `src/components/admin/admin-panel.tsx` (export nombrado + default):
  - Layout `mx-auto w-full max-w-7xl px-4 sm:px-6 py-8`.
  - Back button (`ArrowLeft` → `router.push("/")`), H1 "Panel de Administración", subtítulo "Gestiona los usuarios de la plataforma.".
  - KPIs agregados (4 tiles en `sm:grid-cols-4`): Usuarios totales, Activos, Desactivados (tone destructive), Lotes totales (Σ batchCount).
  - `useSession()` para obtener `currentUserId` (vía cast seguro `(session?.user as {id?: string})?.id` ya que next-auth no declara `id` en el tipo por defecto). Se pasa a `AdminUsersTable` para bloquear self-disable/self-demote en la UI.
  - Estado del diálogo: `selectedUserId` + `detailOpen` se levantan aquí (patrón "lift state up") y se pasan a `<AdminUserDetailDialog>`. La tabla solo llama `onViewDetails(id)`.
  - Estados: skeletons en loading (6 filas), Card con texto destructive + Reintentar en error.
- Verificaciones:
  - `bun run lint` → exit 0, sin warnings ni errores en mis archivos.
  - `bunx tsc --noEmit` → sin errores en `src/components/admin/**` ni `src/hooks/use-admin.ts` (los errores que aparecen en otros archivos — form resolvers, admin API route — son preexistentes de Tasks 2/3 y están fuera de mi scope).
  - `dev.log` sin errores de compilación; `GET /api/admin/users` responde 401 cuando no hay sesión (comportamiento esperado del guard).
- No toqué: `src/app/page.tsx`, `src/components/app-shell.tsx`, `src/components/site-header.tsx`, `src/components/landing/**`, `src/components/auth/**`, `src/components/ui/**`, `src/lib/**`, `prisma/**`, `src/app/api/**`, `src/app/globals.css`, `src/app/layout.tsx`, `src/hooks/use-batches.ts`.

Stage Summary:
- 4 archivos creados:
  1. `src/hooks/use-admin.ts` — hooks TanStack Query (useAdminUsers, useAdminUser, useToggleUserDisabled, useSetUserRole) + helper `patchUser` con fetch PATCH directo.
  2. `src/components/admin/admin-users-table.tsx` — tabla responsive con 10 columnas, dropdown de acciones, confirmación AlertDialog para acciones destructivas, bloqueo de self-disable/self-demote.
  3. `src/components/admin/admin-user-detail-dialog.tsx` — diálogo large con header + KPIs agregados + lista de lotes con métricas.
  4. `src/components/admin/admin-panel.tsx` — componente principal (named + default export), KPIs agregados, orquesta tabla + diálogo.
- `bun run lint` pasa limpio (exit 0). `tsc --noEmit` sin errores en mis archivos.
- Convenciones respetadas: TanStack Query con `mutateAsync` + toasts en try/catch (igual que `use-batches.ts`); moneda COP 0 decimales; fechas es-CO; tema naranja vía `bg-primary`/`text-primary` (sin indigo/azul/verde como primario); status badges con `bg-primary/10 text-primary` (activo) y `bg-destructive/10 text-destructive` (desactivado); responsive mobile-first (tabla con scroll horizontal, KPIs apilables); accesibilidad (aria-labels en iconos, semántica, sr-only live region para carga).
- Listo para que el `app-shell.tsx` enrute a `<AdminPanel/>` cuando `?view=admin` (y el usuario sea admin) — pendiente en el agente main.


---
Task ID: 5-integration
Agent: main (arquitecto) — integración y verificación fase 2
Task: Integrar landing + admin panel, enrutar vistas, botón demo, verificar end-to-end.

Work Log:
- Subagents (Task 3 landing, Task 4 admin UI) completaron con lint limpio.
- AuthScreen: añadido botón "Probar como demo" (con divider "o") + microcopy con credenciales demo + botón "Volver al inicio".
- page.tsx: no-auth → LandingPage por defecto, AuthScreen si ?auth=1 (useSearchParams en Suspense).
- app-shell.tsx: ?view=admin → AdminPanel (solo role admin; si no es admin redirige a /). ?batch=ID → detalle. Sin param → dashboard.
- site-header.tsx: botón "Admin" (ShieldCheck) visible solo para admins; marca clickeable → dashboard.
- BUG encontrado y corregido: NextAuth v4 no transporta campos extra del objeto devuelto por authorize al callback jwt → role llegaba "user". Solución: lookup del rol en BD dentro del callback jwt (patrón estándar v4).
- BUG encontrado y corregido: el cliente Prisma en memoria del dev server estaba cacheado (sin role/disabled) tras db:push → error 500 en login. Solución: reiniciado el dev server para recargar el cliente.
- Verificación Agent Browser end-to-end:
  - Landing (hero, features, manual 5 pasos, CTA, footer) en naranja. Color primary verificado lab(57 47.7 70.3) = naranja.
  - Demo login desde landing → dashboard con 2 lotes sembrados + KPIs correctos (pob 626, mortalidad 2,4%, 6 pesajes).
  - Login admin (admin@avicola.test) → botón Admin en header → panel admin: 4 KPIs + tabla 4 usuarios con stats.
  - Detalle de usuario (María): dialog con info + KPIs + lista de lotes.
  - Desactivar María (confirm dialog) → estado "Desactivado" → María NO puede loguearse (bloqueada).
  - Reactivar María → estado "Activo".
  - Protección anti-lockout: auto-desactivar y auto-degradar deshabilitados en el menú del propio admin.
  - Footer sticky en móvil (bottom=844=vh). Responsive móvil y desktop.
- `bun run lint` → exit 0. dev.log sin errores tras los fixes.

Stage Summary:
- Panel super-admin operativo: ver todos los usuarios, ver detalles, activar/desactivar, cambiar rol (con protecciones).
- Paleta naranja aplicada en toda la web.
- Usuario demo (demo@avicola.test/demo123456) con datos sembrados que se reinician en cada login; botón demo en landing y en auth.
- Landing page con manual de uso de 5 pasos.
- Credenciales: admin@avicola.test/admin123456 · demo@avicola.test/demo123456.

---
Task ID: 6
Agent: main (arquitecto) — venta por kilo
Task: Añadir modo de venta por kilo además de por unidad (pollo).

Work Log:
- Schema: añadidos `unit String @default("unit")` ("unit"|"kilo") y `weight Float?` (kg totales) a Sale. db:push + Prisma Client regenerado.
- Tipos (types.ts): SaleUnit type; Sale ahora tiene unit/weight; SaleInput acepta unit/weight.
- Helper centralizado (src/lib/sale.ts): saleIncome(sale) → kilo: weight×unitPrice; unit: count×unitPrice. Usado por backend (metrics, admin) y frontend (tabla, preview).
- Backend:
  - metrics.ts: totalIncome usa la fórmula según unit.
  - API POST /api/batches/[id]/sales: valida unit (enum) + weight (>0 si kilo).
  - API PUT /api/sales/[id]: acepta unit/weight; limpia weight si cambia a unit.
  - API admin users: select incluye unit/weight; totalIncome usa la nueva fórmula.
- Seed demo: Lote 1 ahora tiene 1 venta por kilo (150 aves, 300 kg, $8.500/kg = $2.550.000) + 1 por unidad (200 × $11.500).
- Frontend:
  - sale-form-dialog: ToggleGroup "Por unidad (pollo)" | "Por kilo"; campos condicionales (Peso total kg + Precio por kilo solo en kilo); preview del ingreso en tiempo real; carga correcta en edición según modo.
  - sales-tab: columnas Aves, Modo (badge Kilo/Unidad), Detalle (kg o —), Precio (con sufijo "por kg"/"por ave"), Ingreso (saleIncome).
- BUG corregido: form.watch devuelve strings (pre-zod-coerce); preview usaba typeof===number → $0. Fix: helper toNum() parsea strings.
- Dev server reiniciado (cliente Prisma cacheado tras db:push).
- Verificación Agent Browser: demo login → lote con venta kilo sembrada → tabla muestra ambos modos → crear venta kilo (80 aves, 160kg, $9.000 → $1.440.000) → KPIs actualizados → editar venta unit (carga modo unidad) → editar venta kilo (carga modo kilo + peso) → admin panel ingresos agregados correctos ($15.511.400).
- `bun run lint` → exit 0. dev.log sin errores.

Stage Summary:
- Las ventas ahora pueden ser por unidad (pollo) o por kilo (peso total × precio/kg).
- El ingreso se calcula automáticamente según el modo y se propaga a KPIs del lote, admin panel y utilidad.
- El demo incluye una venta por kilo de ejemplo.

---
Task ID: 7
Agent: main (arquitecto) — fix visibilidad panel admin
Task: El login como admin mostraba el dashboard sin forma evidente de acceder al panel de super-admin.

Work Log:
- Diagnóstico: la sesión SÍ llevaba role="admin" correctamente. El problema era de UX: el botón "Admin" del header usaba `hidden sm:inline` → en móvil solo mostraba un ícono sin aria-label, indetectable. Además el admin aterriza en el Dashboard (comportamiento correcto) pero no había ningún aviso que le indicara que tiene acceso admin.
- Fix 1 (site-header.tsx): botón Admin ahora siempre muestra texto "Admin", con estilo destacado (bg-primary/10, border-primary/30, font-semibold), aria-label="Panel de administración".
- Fix 2 (site-header.tsx): menú de usuario ahora incluye badge "Administrador" junto al nombre, entrada "Mis lotes" y entrada "Panel de administración" (además de "Cerrar sesión").
- Fix 3 (dashboard.tsx): aviso destacado en la parte superior del dashboard para admins — borde primary, icono ShieldCheck, texto "Tienes acceso de administrador" + botón "Ir al Panel de Administración". Visible en móvil y escritorio.
- Verificación Agent Browser (viewport 390 y 1440): login admin → banner visible → clic → panel admin carga con tabla de usuarios (incluye "Administrador(tú)"). Sin errores.
- `bun run lint` → exit 0. dev.log limpio.

Stage Summary:
- El panel de super-admin ahora es accesible de 3 formas evidentes: botón destacado en header, entrada en menú de usuario, y aviso con botón en el dashboard.
- Credenciales admin: admin@avicola.test / admin123456.

---
Task ID: 8
Agent: main (arquitecto) — cursor pointer global
Task: Aplicar cursor pointer en TODOS los botones y opciones interactivas.

Work Log:
- Diagnóstico: la mayoría de componentes usan <Button> (cubiertos por regla simple), pero algunos componentes shadcn/Radix (DropdownMenuItem, etc.) traen `cursor-default` hardcodeado en su className, y las reglas en @layer base pierden prioridad contra las utilities de Tailwind v4.
- Solución: reglas CSS globales FUERA de @layer (mayor prioridad que utilities) con !important, cubriendo:
  - button, [role=button], a, summary, label[for]
  - [role=menuitem], [role=menuitemradio], [role=menuitemcheckbox], [role=tab], [role=option], [role=combobox]
  - data-slot de todos los triggers Radix: dropdown-menu-item, select-trigger, toggle-group-item, tabs-trigger, accordion-trigger, collapsible-trigger, tooltip-trigger, popover-trigger, dialog-trigger, alert-dialog-trigger, hover-card-trigger, context-menu-trigger, menubar-trigger/item, navigation-menu-trigger/link
  - data-radix-collection-item (fallback para items de colección Radix)
- Estados deshabilitados → cursor: not-allowed (disabled, aria-disabled, data-disabled).
- Inputs de texto/fecha/número/textarea → cursor: text (no pointer).
- Checkbox/Radio nativos → cursor: pointer.
- Verificación Agent Browser (computed style): button=pointer, batchCard(role=button)=pointer, themeToggle=pointer, userMenu=pointer, dropdownMenuItems=pointer (x2), tabs=pointer (x4), editIcon/deleteIcon=pointer, select-trigger=pointer, toggle-group-item=pointer, numberInput=text, admin kebabs=pointer, landing links=pointer (x4), demo button=pointer.
- `bun run lint` → exit 0. Sin errores de página ni dev.log.

Stage Summary:
- Cursor pointer aplicado de forma consistente en TODA la app: botones, enlaces, tabs, selects, toggles, dropdown items, tarjetas clickeables, icon buttons, menús Radix.
- Inputs de texto mantienen cursor-text; elementos deshabilitados muestran not-allowed.
- Sin tocar componentes ui de shadcn (cambio puramente en globals.css).

---
Task ID: 9
Agent: fullstack-developer (Backup UI)
Task: Crear la UI de Copia de Seguridad / Restauración para el panel de super-admin. Español, tema naranja. Descarga binaria + restauración con confirmación destructiva + aviso de recarga tras restore.

Work Log:
- Leí worklog.md (Task IDs 1–8: foundation, API, admin panel, security/cursor). Confirmé que el backend de backup YA existe: `src/app/api/admin/backup/route.ts` (GET → binary .db download con Content-Disposition) y `src/app/api/admin/backup/restore/route.ts` (POST multipart → valida admin + rate-limit 1/2min + magic-header SQLite + cierra Prisma + sobrescribe .db + pide reload).
- Creé `src/hooks/use-backup.ts`:
  - `useDownloadBackup()`: `useMutation` que hace `fetch("/api/admin/backup")`, lee el body como `Blob`, parsea `Content-Disposition` para el filename, crea `URL.createObjectURL` + `<a download>` temporal + `click()` (sin navegar la página), revoca el URL tras 1.5s (compatibilidad Safari). Errores: parse JSON del body → `ApiError` con mensajes en español; 401→"Debes iniciar sesión…"; captura errores de red (servidor caído tras restore) con mensaje que sugiere recargar.
  - `useRestoreBackup()`: `useMutation` que toma un `File`, construye `FormData` con campo `file`, POST a `/api/admin/backup/restore` (sin Content-Type — el navegador define el boundary multipart). En éxito invalida `qk.adminUsers`. Helper `readApiError()` reutilizable para ambos endpoints.
  - Tipos exportados: `DownloadBackupResult`, `RestoreBackupResult` coinciden con el contrato API.
- Creé `src/components/admin/backup-section.tsx`:
  - Card "Copia de Seguridad" con icon-tile naranja (`bg-primary/10 text-primary`) + `DatabaseBackup`.
  - **Parte 1 — Descargar**: icon-tile naranja (`HardDriveDownload`), descripción exacta del contrato + hint de tamaño, Button "Descargar copia de seguridad" (icon `Download`) con `Loader2` spinner mientras `isPending`. Texto cambia a "Descargando…".
  - **Parte 2 — Restaurar**: icon-tile destructive (`bg-destructive/10 text-destructive`, icon `Upload`), descripción con `⚠️` warning + `strong` "REEMPLAZA todos los datos actuales". Input file oculto (`sr-only`, `accept=".db,application/octet-stream"`) disparado por Button outline "Seleccionar archivo .db". Muestra el nombre + tamaño (`formatBytes`) del archivo seleccionado en una pill con botón de quitar. Button destructive "Restaurar base de datos" deshabilitado hasta que haya archivo, con spinner "Restaurando…".
  - **Confirmación**: `AlertDialog` "¿Restaurar base de datos?" con `TriangleAlert` destructive, warning strong "Se reemplazarán TODOS los datos… no se puede deshacer", muestra el archivo seleccionado. Usé `<Button variant="destructive">` normal (NO `AlertDialogAction`) para mantener el diálogo abierto durante la petición y mostrar spinner en el botón "Sí, restaurar". Cancelar cierra sin acción.
  - **Éxito**: `Alert` con borde `primary/40` + bg `primary/5`, icono `RefreshCw` naranja, título "Restauración completada" (color primary), mensaje del API + explicación clara de que la conexión Prisma se cerró y DEBE recargar, botón prominente "Recargar página" (`window.location.reload()`). `role="status" aria-live="polite"`.
  - **Errores**: toast `variant="destructive"` con el `error` del API (ej. "El archivo no es una base de datos SQLite válida", "Espera unos minutos antes de restaurar nuevamente" para 429).
  - Separador `<Separator/>` entre las dos partes. Layout responsive (`flex-col sm:flex-row`, `w-full sm:w-auto`).
- Edité `src/components/admin/admin-panel.tsx`: importé `BackupSection` y lo renderizo justo DESPUÉS de la sección de tabla de usuarios (`</div>` de `mt-6`) y ANTES del `AdminUserDetailDialog`. La Card ya incluye `mt-8` para separación visual.
- Calidad: `bun run lint` → exit 0 (sin warnings ni errores). Dev server recompiló limpio (`✓ Compiled in 194ms`), `GET / 200` en 487ms.
- Accesibilidad: `aria-label` en botones de icono y en input file oculto, `aria-labelledby` en secciones, `role="status"` + `aria-live="polite"` en alert de éxito, `sr-only` para el botón "Quitar archivo", focus-visible heredado de shadcn.

Stage Summary:
- UI de backup/restore lista y conectada al API existente. Cumple contrato exacto (GET binario con Content-Disposition; POST multipart con campo `file` → `{success, message, size}`).
- `useDownloadBackup()` descarga sin navegar la página (blob + object URL + `<a download>`), con manejo robusto de errores JSON y de red.
- `useRestoreBackup()` usa FormData multipart correcto, invalida `qk.adminUsers` al éxito.
- Confirmación destructiva con AlertDialog, spinner durante la petición, Alert de éxito MUY visible con botón "Recargar página" (porque el restore cierra la conexión Prisma y exige reload).
- Tema naranja respetado (sin blue/indigo/green). Destructive solo para restaurar (acción que reemplaza datos). Español en todos los textos.
- Archivos creados: `src/hooks/use-backup.ts`, `src/components/admin/backup-section.tsx`. Archivo editado: `src/components/admin/admin-panel.tsx` (+1 import, +3 líneas JSX).

---
Task ID: 10
Agent: main (arquitecto) — seguridad + backup/restore
Task: Mejorar seguridad (auth, middleware, headers, rate limit, contraseñas) y sistema de backup/restore de BD.

Work Log:
SEGURIDAD:
- Rate limiter en memoria (src/lib/rate-limit.ts): rateLimit(key, max, window) + getClientIp. Login: 10/15min por IP. Registro: 5/hora por IP.
- auth.ts: rate limit en authorize, JWT maxAge 12h + updateAge 1h, re-check disabled en callback jwt (token.disabled), propagación a session.
- session.ts: getCurrentUser() devuelve null si token.disabled (cuenta desactivada en caliente cierra la sesión).
- middleware.ts (Next 16): getToken + 401 JSON para /api/* excepto auth/register. Verificado: /api/batches → 401 {"error":"No autenticado"}.
- next.config.ts: headers de seguridad (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS).
- register route: validación de contraseña robusta (min 8, letra + número), rate limit de registro. AuthScreen actualizado con nueva política.
- BUG corregido: authorize recibía req de NextAuth (no Request estándar) → getClientIp fallaba con "h.get is not a function". Fix: leer headers como Record directamente.
- BUG corregido: middleware con `export { default } from "next-auth/middleware"` no funcionaba en Next 16 → reescrito con getToken explícito + NextResponse 401.

BACKUP/RESTORE:
- API GET /api/admin/backup: lee el archivo .db (SQLite) y lo devuelve como descarga con Content-Disposition + timestamp. Solo admin.
- API POST /api/admin/backup/restore: recibe multipart/form-data con file .db, valida magic header "SQLite format 3", límite 50MB, rate limit 1/2min, cierra Prisma, sobrescribe el archivo. Solo admin.
- BUG corregido: import `next/response` no existe en Next 16 → cambiado a `next/server`.
- UI (subagent Task 9): BackupSection en admin panel (descargar con blob download, restaurar con file input + AlertDialog de confirmación + Alert de éxito con botón "Recargar página").

VERIFICACIÓN Agent Browser:
- Login admin funciona tras fixes.
- Middleware: /api/batches y /api/admin/users → 401 JSON sin sesión; /api/register público.
- Headers de seguridad: los 5 presentes (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS).
- Backup download: genera archivo SQLite válido (86KB, "SQLite format 3").
- Restore: sube .db → confirmación → éxito → Alert "Recargar página" → reload → sesión admin persiste (datos restaurados del backup).
- Validación: archivo no-SQLite rechazado por el backend.
- `bun run lint` → exit 0. dev.log sin errores.

Stage Summary:
- Seguridad reforzada: middleware 401 JSON, rate limiting (login + registro), JWT expira, re-check disabled, contraseñas robustas, headers de seguridad.
- Backup/restore operativo en panel admin: descargar .db, restaurar .db con validación y confirmación.
- Credenciales: admin@avicola.test / admin123456.

---
Task ID: 11
Agent: main (arquitecto) — validación cierre de sesión + fix crítico
Task: Validar el flujo de logout; se encontró y corrigió un bug crítico de auth.

Work Log:
- Al validar el cierre de sesión se detectó que las rutas /api/* devolvían 401 incluso CON sesión activa.
- Diagnóstico: el dev.log mostraba `[next-auth][warn][NO_SECRET]` y `JWEDecryptionFailed`.
- CAUSA RAÍZ: el archivo `.env` había perdido las variables `NEXTAUTH_SECRET` y `NEXTAUTH_URL` (solo quedaba `DATABASE_URL`). Sin secret, getServerSession no podía desencriptar el JWT → todos los getCurrentUser() devolvían null → 401.
- Se restauró `.env` con NEXTAUTH_SECRET y NEXTAUTH_URL.
- Se añadió `secret: process.env.NEXTAUTH_SECRET` explícito en authOptions (defensa adicional para Turbopack).
- El middleware se simplificó a verificación de cookie (next-auth.session-token), ya que getToken de next-auth/jwt no funciona bien en Next 16 Turbopack. La validación criptográfica real la hace getServerSession en cada handler.
- Se reinició el dev server limpio (rm -rf .next) para descartar caché corrupta.

VERIFICACIÓN Agent Browser (flujo completo de sesión):
1. Sin sesión: /api/batches → 401, /api/admin/users → 401 ✓
2. Login admin: POST /api/auth/callback/credentials → sesión activa ✓
3. Con sesión: /api/batches → 200 OK, /api/admin/users → 200 OK ✓
4. Logout (menú → "Cerrar sesión"): POST /api/auth/signout → 200 ✓
5. Tras logout: /api/auth/session → "NO SESSION" ✓
6. Tras logout: /api/batches → 401 BLOCKED, /api/admin/users → 401 BLOCKED ✓
7. Cookie next-auth.session-token eliminada (solo quedan csrf + callback-url inofensivas) ✓
8. Tras logout, ?view=admin y ?batch=<id> muestran landing (no panel) ✓
- `bun run lint` → exit 0. dev.log sin errores nuevos.

Stage Summary:
- Cierre de sesión validado end-to-end: la cookie se elimina, la sesión se invalida, las rutas protegidas bloquean el acceso, las vistas protegidas redirigen a landing.
- Bug crítico corregido: .env restaurado con NEXTAUTH_SECRET. Sin este fix, NINGUNA ruta autenticada funcionaba.
