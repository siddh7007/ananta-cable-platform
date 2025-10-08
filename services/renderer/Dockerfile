FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY services/renderer/package.json ./services/renderer/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY services/renderer ./services/renderer
COPY tsconfig.base.json ./

# Build
WORKDIR /app/services/renderer
RUN pnpm build

# Expose port
EXPOSE 5002

# Start
CMD ["pnpm", "start"]
