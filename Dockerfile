# AfriScout worker image
# Builds the shared package + api, then runs the worker entrypoint.

FROM node:20.11-alpine

WORKDIR /app

# Install OS deps needed by Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy manifests first for better layer caching
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json

# Install all workspace deps
RUN npm ci

# Copy source
COPY . .

# Build shared + api
RUN npm run build:shared
RUN npm run db:generate --workspace=apps/api
RUN npm run build:api

# Default command: run the worker
CMD ["npm", "run", "start:worker"]