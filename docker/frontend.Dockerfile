FROM node:18-alpine AS builder

WORKDIR /app

# Install deps and build
COPY package.json package-lock.json* ./
COPY src ./src
COPY index.html vite.config.ts tsconfig.json ./
RUN npm ci --silent
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Serve built files with a tiny static server
RUN npm install -g serve@14
COPY --from=builder /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
