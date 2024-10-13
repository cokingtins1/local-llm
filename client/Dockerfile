# # Use a Node.js base image
# FROM node:18-slim AS base

# FROM base AS builder

# # Set the working directory
# WORKDIR /app

# # Copy package.json and install dependencies
# COPY package.json package-lock.json* ./
# RUN npm install

# ENV NODE_ENV=production

# # Copy the rest of the client files
# COPY . .

# # Build the Next.js app
# RUN npm run build

# FROM base AS runner
# WORKDIR /app

# # COPY --from=builder /app/public ./public

# RUN mkdir .next
# RUN chown nextjs:nodejs .next

# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# USER nextjs

# EXPOSE 3000

# ENV PORT=3000

# # Specify the command to run the Next.js app
# CMD ["npm", "start"]

# Use a Node.js base image
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the client files
COPY . .

# Build the Next.js app
RUN npm run build

# Specify the command to run the Next.js app
CMD ["npm", "start"]