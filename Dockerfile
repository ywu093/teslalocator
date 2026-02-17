# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY client/package.json client/
COPY server/package.json server/

# Install all dependencies
RUN npm ci

# Copy source code
COPY client/ client/
COPY server/ server/

# Build client (Vite produces client/dist/)
RUN npm run build:client

# Build server (TypeScript compiles to server/dist/)
RUN npm run build:server

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY server/package.json server/

# Install production dependencies only for server
RUN npm ci --workspace=server --omit=dev

# Copy built server
COPY --from=builder /app/server/dist/ server/dist/

# Copy built client (served by Express as static files)
COPY --from=builder /app/client/dist/ client/dist/

# Copy key pair directory if needed at runtime (or generate on start)
# The server generates keys on startup via keyService.ensureKeyPair()

# Create directory for persistent config
RUN mkdir -p /app/server/keys

EXPOSE 3001

# Set production defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV CORS_ORIGIN=*

CMD ["node", "server/dist/index.js"]
