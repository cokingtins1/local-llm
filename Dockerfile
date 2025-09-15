# # Use a Node.js base image
# FROM node:18-alpine AS base

# # Install OpenSSL for Prisma
# RUN apk add --no-cache openssl

# # Set the working directory
# WORKDIR /app

# # Copy package.json and install dependencies
# COPY package.json .
# RUN npm install

# # Development stage
# FROM base AS dev
# COPY . .
# RUN npx prisma generate
# EXPOSE 3000
# CMD ["npm", "run", "dev"]

# # Production stage
# FROM base AS prod
# COPY . .
# RUN npx prisma generate
# RUN npm run build
# EXPOSE 3000
# CMD ["node", ".next/standalone/server.js"]

# Use a Node.js base image
FROM node:18-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install dependencies with legacy-peer-deps to avoid zod conflicts
RUN npm install --legacy-peer-deps

# Copy Prisma schema separately so prisma generate can be cached
COPY prisma ./prisma
RUN npx prisma generate

# Development stage
FROM base AS dev
# Copy rest of the source after dependencies to leverage caching
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS prod
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
