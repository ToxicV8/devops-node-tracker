FROM node:24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache \
    g++ \
    make \
    openssl-dev \
    python3

COPY package*.json ./prisma/ ./

RUN --mount=type=cache,target=/root/.npm npm ci --only=production=false

RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:24-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

RUN apk add --no-cache \
    dumb-init \
    openssl

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/src/graphql/schema.graphql ./graphql/schema.graphql

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]