# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Development stage - with watch mode and src mounting
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npx", "tsup", "src/index.ts", "--format", "cjs", "--out-dir", "dist", "--watch", "--onSuccess", "node dist/index.cjs"]

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
