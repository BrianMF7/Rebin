# Multi-stage build for development with security hardening
FROM node:18-alpine as base

# Set environment variables for security
ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set work directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with security best practices
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy source code with proper ownership
COPY --chown=nextjs:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/.next /app/node_modules/.cache && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1

# Expose port
EXPOSE 5173

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
