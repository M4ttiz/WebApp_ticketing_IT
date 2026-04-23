FROM node:18-alpine
WORKDIR /usr/src/app

# Install deps (copy package files first for cached layers)
COPY package*.json ./
RUN npm install --production --legacy-peer-deps || npm install --production

# Copy application files
COPY prisma ./prisma
COPY src ./src
COPY .env ./

# Generate Prisma client (best-effort)
RUN npx prisma generate || true

EXPOSE 5000
CMD ["node", "src/server.js"]
