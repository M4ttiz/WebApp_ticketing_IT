FROM node:18-alpine
WORKDIR /usr/src/app

# Install deps (copy package files first for cached layers)
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install

# Copy application files
COPY prisma ./prisma
COPY src ./src
COPY .env ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Generate Prisma client and fail build if it cannot be generated
RUN npx prisma generate
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 5000
CMD ["./docker-entrypoint.sh"]
