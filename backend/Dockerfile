FROM node:18-alpine
WORKDIR /usr/src/app

# Install deps (copy package files first for cached layers)
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install

# Copy application files
COPY prisma ./prisma
COPY src ./src
COPY .env ./

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000
CMD ["node", "src/server.js"]
