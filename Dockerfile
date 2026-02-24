# Build stage
FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
# Force install ALL dependencies including devDependencies
# --production=false explicitly overrides NODE_ENV=production from Coolify
RUN npm ci --production=false

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN tsc --version

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
