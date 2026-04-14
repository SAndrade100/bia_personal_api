FROM node:20-alpine AS builder
WORKDIR /app

# install deps (including dev deps so Prisma CLI is available at runtime)
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.mjs ./
ARG BUILD_DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build_db"
ENV DATABASE_URL=$BUILD_DATABASE_URL
RUN npm ci

# copy sources and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy built app and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 3333

# Run pending migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
