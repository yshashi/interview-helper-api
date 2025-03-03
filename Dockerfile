FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY .env.example ./.env

# Create logs directory
RUN mkdir -p logs

# Run as non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
