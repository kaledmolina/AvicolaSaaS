// Seed: crea la cuenta administradora y la cuenta demo con datos de muestra.
// Ejecutar con: bun run prisma/seed.ts

import { db } from "../src/lib/db"
import { hashPassword } from "../src/lib/password"
import { resetDemoData } from "../src/lib/demo-data"
import { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/accounts"

async function main() {
  // Admin
  await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin", disabled: false },
    create: {
      name: "Administrador",
      email: ADMIN_EMAIL,
      password: hashPassword(ADMIN_PASSWORD),
      role: "admin",
      disabled: false,
    },
  })
  console.log(`✓ Admin listo → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)

  // Demo
  const demo = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { disabled: false },
    create: {
      name: "Usuario Demo",
      email: DEMO_EMAIL,
      password: hashPassword(DEMO_PASSWORD),
      role: "user",
      disabled: false,
    },
  })
  await resetDemoData(demo.id)
  console.log(`✓ Demo listo  → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
