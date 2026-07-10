FROM node:20-alpine AS base

# Dependencias base necesarias para SQLite/Prisma
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiar archivos de dependencias e instalarlas
COPY package.json package-lock.json* ./
RUN npm install

# Reconstruir código fuente
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente de Prisma y empaquetar aplicación
RUN npx prisma generate
RUN npm run build

# Imagen de producción, copiar archivos y ejecutar servidor
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario seguro para el contenedor
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configurar permisos para Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Crear directorio de persistencia de Base de Datos
RUN mkdir -p /app/db && chown -R nextjs:nodejs /app/db

# Copiar compilación del proyecto (standalone copy)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Estas carpetas normalmente ya se copian solas gracias al script del package.json, 
# pero nos aseguramos de que existan para el servidor en producción.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Asignar usuario final
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Ejecutar el servidor standalone de Next.js
CMD ["node", "server.js"]
