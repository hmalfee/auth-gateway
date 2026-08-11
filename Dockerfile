# syntax=docker/dockerfile:1
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION=9.1.0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat bash
RUN corepack enable pnpm && corepack install -g "pnpm@${PNPM_VERSION}"

FROM base AS installer
WORKDIR /app
# Install build tools for native addons (e.g., better-sqlite3)
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --network-concurrency=64 --config.audit=false

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
# Run build - the postbuild script will be triggered by package.json scripts (if configured)
# and prepare the standalone directory.
RUN pnpm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
RUN apk add --no-cache libstdc++
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build directly to /app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["node", "server.js"]
