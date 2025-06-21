# Simple Node.js Dockerfile for Issue Tracker Backend

FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Install TypeScript and build dependencies
RUN npm install -g typescript && \
    npm install --only=dev && \
    npm run build

# Copy GraphQL schema to dist folder
RUN mkdir -p dist/graphql && \
    cp src/graphql/schema.graphql dist/graphql/

# Clean up dev dependencies
RUN npm prune --production

# Generate Prisma client
RUN npx prisma generate

# Set ownership
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node healthcheck.js || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]