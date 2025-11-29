# Dockerfile for Message Queue Service

FROM node:20-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm install

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Keep dev dependencies for runtime build (needed for volume mounts)
# Don't remove dev dependencies as volume mount may overwrite dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start server - install deps, build, then run (handles volume mount overwrites)
CMD ["sh", "-c", "npm install && npm run build && node dist/server.js"]
