# Build stage
FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
# Install ALL dependencies (including devDependencies) regardless of NODE_ENV
# This is critical for TypeScript compilation
RUN npm install --include=dev

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:22 AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm install

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs && chown -R node:node logs

USER node

EXPOSE 5500

CMD ["node", "dist/index.js"]
