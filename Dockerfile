# Etape 1: Build the application
FROM node:24.1.0 AS builder

# Install system dependencies needed for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml (if available) into the root directory of the container
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --prod=false

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN pnpm build

# Étape 2: Production image
FROM node:24.1.0

# No additional dependencies needed for Ubuntu base

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the rest of the application files
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]