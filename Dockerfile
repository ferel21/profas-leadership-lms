FROM node:20-alpine AS base

# Step 1: Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Step 2: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
# Build-time placeholders keep Prisma/Next compilation independent from the
# real database and secrets. Runtime values are validated by the entrypoint.
ARG NEXT_PUBLIC_APP_URL=https://profas-leadership-lms.vercel.app
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?connect_timeout=1" \
    DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build?connect_timeout=1" \
    JWT_SECRET="build-only-secret-012345678901234567890123456789" \
    NEXTAUTH_SECRET="build-only-nextauth-secret-012345678901234567890" \
    NEXTAUTH_URL="https://build.invalid" \
    NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
    PRIVATE_UPLOAD_DIR="/app/.data/uploads" \
    HEALTHCHECK_TOKEN="build-only-health-token-012345678901234567890"
RUN npx prisma generate
RUN npm run build

# Step 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set up private permanent upload directory with correct permissions.
# Files must not live under /public because Next.js can serve that directory
# without passing through the authorization checks in /api/uploads.
RUN mkdir -p /app/.data/uploads && chown -R nextjs:nodejs /app/.data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts/validate-env.mjs ./scripts/validate-env.mjs
COPY --from=builder --chown=nextjs:nodejs /app/deploy/vps/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
