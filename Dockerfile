FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Pre-create data dirs so Docker seeds named volumes with correct ownership on first mount
RUN mkdir -p /data/config /data/uploads \
    && chown -R nextjs:nodejs /data

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma generated client
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Prisma schema, migrations and config
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Install only what's needed for migrations at runtime
# Remove stubs created by Next.js standalone tracing first
RUN rm -rf node_modules/pg node_modules/@prisma/adapter-pg \
    && npm install --no-save prisma@7.8.0 @prisma/client@7.8.0 @prisma/adapter-pg@7.8.0 pg tsx dotenv \
    && chown -R nextjs:nodejs /app/node_modules

COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["./entrypoint.sh"]
