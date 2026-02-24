# Build stage - Install dependencies and compile TypeScript
FROM node:22 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies) 
# Use --omit=dev=false to force devDependencies installation even when NODE_ENV=production
RUN npm ci --omit=dev=false --ignore-scripts

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Verify TypeScript is installed and build
RUN npx tsc --version
RUN npm run build

# Production stage - Minimal runtime image
FROM node:22 AS production

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema (needed for migrations/introspection)
COPY --from=builder /app/prisma ./prisma

# Copy compiled JavaScript
COPY --from=builder /app/dist ./dist

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R node:node /app

# Use non-root user for security
USER node

# Expose application port
EXPOSE 5500

# Start application
CMD ["node", "dist/index.js"]
