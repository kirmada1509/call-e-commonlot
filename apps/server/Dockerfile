FROM oven/bun:1 AS builder

WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile
RUN bun run build --filter=server

FROM oven/bun:1-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app /app

EXPOSE 3000
CMD ["bun", "run", "apps/server/dist/index.mjs"]
