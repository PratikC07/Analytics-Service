# --- Stage 1: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# FIX 1: Provide a dummy URL for the build-time config file
ENV DATABASE_URL="placeholder-for-build-only"

RUN npx prisma generate

# This command now runs `tsc && npm run copy:prisma`
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine
WORKDIR /app

# FIX 2: Skip the postinstall script
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy the entire /dist folder, which now includes the query engine
COPY --from=builder /app/dist ./dist

# Copy the prisma folder for runtime migrations
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000